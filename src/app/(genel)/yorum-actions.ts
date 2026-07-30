"use server";

import { revalidatePath } from "next/cache";
import { istekIpHash, yorumHizSiniri } from "@/lib/moderasyon/hiz-siniri";
import { onFiltre } from "@/lib/moderasyon/on-filtre";
import { puanlariYenidenHesapla } from "@/lib/moderasyon/puan-hesapla";
import { prisma } from "@/lib/prisma";
import { uyeVarsa } from "@/lib/rbac";
import { yorumSemasi } from "@/lib/validations/yorum";

export interface YorumDurumu {
  hata?: string;
  alanHatalari?: Record<string, string>;
  bilgi?: string;
  girisGerekli?: boolean;
}

export async function yorumGonder(
  _oncekiDurum: YorumDurumu | undefined,
  formData: FormData,
): Promise<YorumDurumu> {
  // §4.9: "Giriş + e-posta doğrulaması zorunlu."
  const uye = await uyeVarsa();
  if (!uye) return { girisGerekli: true, hata: "Yorum yapmak için giriş yapın." };
  if (!uye.epostaDogrulandi) {
    return { hata: "Yorum yapabilmek için önce e-posta adresinizi doğrulayın." };
  }

  const ayristirilmis = yorumSemasi.safeParse({
    ilanId: formData.get("ilanId"),
    puan: formData.get("puan"),
    icerik: formData.get("icerik"),
  });

  if (!ayristirilmis.success) {
    const alanHatalari: Record<string, string> = {};
    for (const sorun of ayristirilmis.error.issues) {
      alanHatalari[String(sorun.path[0])] = sorun.message;
    }
    return { alanHatalari };
  }

  const { ilanId, puan, icerik } = ayristirilmis.data;

  const ilan = await prisma.ilan.findFirst({
    where: { id: ilanId, yayinDurumu: "YAYINDA" },
    select: { id: true, slug: true },
  });
  if (!ilan) return { hata: "Bu ilan artık yayında değil." };

  const ipHash = await istekIpHash();

  const sinir = await yorumHizSiniri(uye.kullaniciId, ipHash);
  if (!sinir.izinli) return { hata: sinir.mesaj };

  // §4.9 ön filtre. TEMIZ bile olsa yorum BEKLIYOR kaydedilir — filtre
  // moderatörün yerine geçmez, yalnızca kuyruğu sıralar ve açık ihlalleri
  // baştan REDDEDILDI işaretler.
  const filtre = onFiltre(icerik ?? "");
  const durum = filtre.karar === "RET" ? "REDDEDILDI" : "BEKLIYOR";

  const veri = {
    puan: puan ?? null,
    icerik: icerik ?? "",
    durum,
    otomatikSkor: filtre.skor,
    moderasyonNotu: filtre.tetiklenenKurallar.length ? filtre.tetiklenenKurallar.join(" · ") : null,
    ipHash,
  } as const;

  // §4.9 "İlan başına tek yorum": ikinci gönderim hata değil, güncelleme.
  // Güncellenen yorum yeniden BEKLIYOR'a düşer — onaylı bir yorumu
  // değiştirip moderasyonu atlatmak mümkün olmamalı.
  const mevcut = await prisma.yorum.findUnique({
    where: { ilanId_kullaniciId: { ilanId, kullaniciId: uye.kullaniciId } },
    select: { id: true },
  });

  if (mevcut) {
    await prisma.yorum.update({ where: { id: mevcut.id }, data: veri });
  } else {
    await prisma.yorum.create({ data: { ...veri, ilanId, kullaniciId: uye.kullaniciId } });
  }

  // Onaylı bir yorum düzenlenip BEKLIYOR'a düştüyse ortalama da düşmeli.
  await puanlariYenidenHesapla(ilanId);

  revalidatePath(`/ilan/${ilan.slug}`);
  revalidatePath("/hesabim/yorumlarim");

  if (durum === "REDDEDILDI") {
    return {
      hata:
        "Yorumunuz otomatik filtreye takıldı. İletişim bilgisi (telefon, e-posta, sosyal medya) " +
        "ve hakaret içeren yorumlar yayınlanmıyor.",
    };
  }

  return {
    bilgi: "Yorumunuz alındı. Moderatör onayından sonra yayınlanacak.",
  };
}

export async function yorumSil(formData: FormData): Promise<void> {
  const uye = await uyeVarsa();
  if (!uye) return;

  const yorumId = (formData.get("yorumId") as string) || "";

  // Sahiplik kontrolü sorgunun kendisinde: başkasının yorumu silinemez.
  const yorum = await prisma.yorum.findFirst({
    where: { id: yorumId, kullaniciId: uye.kullaniciId },
    select: { id: true, ilanId: true, ilan: { select: { slug: true } } },
  });
  if (!yorum) return;

  await prisma.yorum.delete({ where: { id: yorum.id } });
  await puanlariYenidenHesapla(yorum.ilanId);

  revalidatePath(`/ilan/${yorum.ilan.slug}`);
  revalidatePath("/hesabim/yorumlarim");
}
