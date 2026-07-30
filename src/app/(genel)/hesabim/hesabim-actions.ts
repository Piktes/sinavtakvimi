"use server";

import argon2 from "argon2";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { requireUye } from "@/lib/rbac";
import { sifreSemasi } from "@/lib/validations/sifre";

export interface HesapDurumu {
  hata?: string;
  bilgi?: string;
}

export async function duzeyiKaydet(
  _oncekiDurum: HesapDurumu | undefined,
  formData: FormData,
): Promise<HesapDurumu> {
  const uye = await requireUye();
  const ham = (formData.get("duzeyId") as string) || "";
  const duzeyId = ham === "" ? null : ham;

  if (duzeyId) {
    const gecerli = await prisma.etiket.findFirst({
      where: { id: duzeyId, tip: "DUZEY", aktifMi: true },
      select: { id: true },
    });
    if (!gecerli) return { hata: "Seçilen düzey geçersiz." };
  }

  await prisma.kullanici.update({ where: { id: uye.kullaniciId }, data: { duzeyId } });
  revalidatePath("/hesabim");
  return { bilgi: "Düzey tercihiniz kaydedildi." };
}

const sifreDegistirSemasi = z
  .object({
    mevcutSifre: z.string().min(1, "Mevcut şifrenizi girin."),
    yeniSifre: sifreSemasi,
    yeniSifreTekrar: z.string(),
  })
  .refine((veri) => veri.yeniSifre === veri.yeniSifreTekrar, {
    path: ["yeniSifreTekrar"],
    message: "Şifreler eşleşmiyor.",
  });

export async function sifreDegistir(
  _oncekiDurum: HesapDurumu | undefined,
  formData: FormData,
): Promise<HesapDurumu> {
  const uye = await requireUye();

  const ayristirilmis = sifreDegistirSemasi.safeParse({
    mevcutSifre: formData.get("mevcutSifre"),
    yeniSifre: formData.get("yeniSifre"),
    yeniSifreTekrar: formData.get("yeniSifreTekrar"),
  });

  if (!ayristirilmis.success) {
    return { hata: ayristirilmis.error.issues[0]?.message ?? "Form geçersiz." };
  }

  const kayit = await prisma.kullanici.findUnique({
    where: { id: uye.kullaniciId },
    select: { sifreHash: true },
  });
  if (!kayit) return { hata: "Hesap bulunamadı." };

  if (!(await argon2.verify(kayit.sifreHash, ayristirilmis.data.mevcutSifre))) {
    return { hata: "Mevcut şifreniz hatalı." };
  }

  // Oturum sürümü artıyor → dağıtılmış tüm JWT'ler anında geçersizleşiyor
  // (bkz. rbac.ts). Kendi oturumumuz da düşeceği için çıkış yaptırıyoruz.
  await prisma.kullanici.update({
    where: { id: uye.kullaniciId },
    data: {
      sifreHash: await argon2.hash(ayristirilmis.data.yeniSifre, { type: argon2.argon2id }),
      oturumSurumu: { increment: 1 },
      sifreDegistirmeZorunlu: false,
    },
  });

  await signOut({ redirect: false });
  redirect("/giris?sifreDegisti=1");
}

export async function abonelikKaldir(formData: FormData): Promise<void> {
  const uye = await requireUye();
  const abonelikId = (formData.get("abonelikId") as string) || "";

  // Sahiplik kontrolü kaydın kendisinde: başkasının aboneliği silinemez.
  await prisma.abonelik.deleteMany({ where: { id: abonelikId, kullaniciId: uye.kullaniciId } });
  revalidatePath("/hesabim");
}

export async function hesabimdanCik(): Promise<void> {
  await signOut({ redirectTo: "/" });
}
