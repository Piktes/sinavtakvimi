import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

// §4.9 / §7: "Hız sınırı (giriş, kayıt, yorum)."
//
// Ayrı bir tablo veya Redis eklemiyoruz: yorumlar zaten zaman damgalı ve
// kullanıcıya bağlı, sayaç doğrudan `yorumlar` tablosundan okunuyor.
// Bu, sunucu yeniden başlasa da sınırın korunması demek — bellekte tutulan
// bir sayaç her dağıtımda sıfırlanırdı.

/** §7 KVKK: ham IP asla saklanmaz, yalnızca tuzlanmış hash. */
export async function istekIpHash(): Promise<string> {
  const tuz = process.env.IP_HASH_SALT;
  const basliklar = await headers();
  const ham =
    basliklar.get("x-forwarded-for")?.split(",")[0]?.trim() ?? basliklar.get("x-real-ip") ?? "";

  // Tuz yoksa bile bir değer üretiyoruz: `Yorum.ipHash` NOT NULL ve
  // ham IP yazmak asla seçenek değil.
  return createHash("sha256")
    .update(`${tuz ?? "tuzsuz"}:${ham}`)
    .digest("hex");
}

export interface HizSiniriSonucu {
  izinli: boolean;
  /** Kullanıcıya gösterilecek mesaj — izinliyse boş. */
  mesaj?: string;
}

// Aynı kullanıcı kısa sürede çok yorum yazamaz. Sayılar §4.9'da verilmemiş;
// gerçek kullanımda bir öğrenci saatte birkaç denemeye yorum yazar, günde
// onlarcasına yazmaz.
const PENCERE_DK = 10;
const PENCEREDE_EN_COK = 3;
const GUNDE_EN_COK = 15;

export async function yorumHizSiniri(
  kullaniciId: string,
  ipHash: string,
): Promise<HizSiniriSonucu> {
  const simdi = new Date();
  const pencereBasi = new Date(simdi.getTime() - PENCERE_DK * 60_000);
  const gunBasi = new Date(simdi.getTime() - 24 * 60 * 60_000);

  // Hem kullanıcıya hem IP'ye bakılıyor: kullanıcı sınırı tek hesabı,
  // IP sınırı çok hesap açarak sınırı aşmayı engelliyor.
  const [pencerede, gunde] = await Promise.all([
    prisma.yorum.count({
      where: { olusturulma: { gte: pencereBasi }, OR: [{ kullaniciId }, { ipHash }] },
    }),
    prisma.yorum.count({
      where: { olusturulma: { gte: gunBasi }, OR: [{ kullaniciId }, { ipHash }] },
    }),
  ]);

  if (pencerede >= PENCEREDE_EN_COK) {
    return {
      izinli: false,
      mesaj: `Kısa sürede çok fazla yorum gönderdiniz. ${PENCERE_DK} dakika sonra tekrar deneyin.`,
    };
  }

  if (gunde >= GUNDE_EN_COK) {
    return { izinli: false, mesaj: "Günlük yorum sınırına ulaştınız. Yarın tekrar deneyin." };
  }

  return { izinli: true };
}
