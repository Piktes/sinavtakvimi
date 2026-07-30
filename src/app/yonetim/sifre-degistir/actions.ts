"use server";

import argon2 from "argon2";
import { signOut } from "@/auth";
import { denetimYaz } from "@/lib/denetim";
import { prisma } from "@/lib/prisma";
import { requireGiris } from "@/lib/rbac";
import { sifreDegistirmeSemasi } from "@/lib/validations/sifre";

export interface SifreDurumu {
  hata?: string;
  alanHatalari?: Record<string, string>;
}

export async function sifreDegistir(
  _oncekiDurum: SifreDurumu | undefined,
  formData: FormData,
): Promise<SifreDurumu> {
  // §6: yetki kontrolü action içinde de yapılır.
  const oturum = await requireGiris();

  const ayristirilmis = sifreDegistirmeSemasi.safeParse({
    mevcutSifre: formData.get("mevcutSifre"),
    yeniSifre: formData.get("yeniSifre"),
    yeniSifreTekrar: formData.get("yeniSifreTekrar"),
  });

  if (!ayristirilmis.success) {
    const alanHatalari: Record<string, string> = {};
    for (const sorun of ayristirilmis.error.issues) {
      alanHatalari[String(sorun.path[0])] = sorun.message;
    }
    return { alanHatalari };
  }

  const kullanici = await prisma.kullanici.findUnique({
    where: { id: oturum.kullaniciId },
    select: { sifreHash: true },
  });
  if (!kullanici) return { hata: "Kullanıcı bulunamadı." };

  const dogruMu = await argon2.verify(kullanici.sifreHash, ayristirilmis.data.mevcutSifre);
  if (!dogruMu) return { alanHatalari: { mevcutSifre: "Mevcut şifre hatalı." } };

  await prisma.kullanici.update({
    where: { id: oturum.kullaniciId },
    data: {
      sifreHash: await argon2.hash(ayristirilmis.data.yeniSifre, { type: argon2.argon2id }),
      sifreDegistirmeZorunlu: false,
      // Oturum sürümü artınca o ana kadar dağıtılmış tüm token'lar
      // geçersizleşir — şifre değiştiren kişi diğer cihazlardan da düşer.
      oturumSurumu: { increment: 1 },
    },
  });

  await denetimYaz({
    adminId: oturum.kullaniciId,
    eylem: "GUNCELLE",
    varlik: "Kullanici",
    varlikId: oturum.kullaniciId,
    // Şifre hash'i denetim kaydına YAZILMAZ.
    sonrasi: { alan: "sifreHash", degisti: true },
  });

  // Kendi oturumumuz da artık eski sürümde — yeni şifreyle tekrar giriş.
  // signOut yönlendirme için hata fırlatır, bu satırdan sonrası çalışmaz.
  await signOut({ redirectTo: "/yonetim/giris?sifre=degisti" });
  return {};
}
