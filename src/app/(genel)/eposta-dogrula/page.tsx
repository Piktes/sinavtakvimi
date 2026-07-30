import type { Metadata } from "next";
import Link from "next/link";
import { butonVaryantlari } from "@/components/ui/button";
import { Card, CardGovde } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "E-posta doğrulama" };

type Sonuc = "tamam" | "zaten" | "gecersiz" | "suresi-doldu";

async function jetonuIsle(jeton: string | undefined): Promise<Sonuc> {
  if (!jeton) return "gecersiz";

  const kayit = await prisma.verificationToken.findUnique({ where: { token: jeton } });
  if (!kayit) return "gecersiz";

  if (kayit.expires < new Date()) {
    await prisma.verificationToken.delete({ where: { token: jeton } });
    return "suresi-doldu";
  }

  const kullanici = await prisma.kullanici.findUnique({
    where: { eposta: kayit.identifier },
    select: { id: true, epostaDogrulandi: true },
  });

  // Jeton tek kullanımlık: sonucu ne olursa olsun tüketiliyor.
  await prisma.verificationToken.delete({ where: { token: jeton } });

  if (!kullanici) return "gecersiz";
  if (kullanici.epostaDogrulandi) return "zaten";

  await prisma.kullanici.update({
    where: { id: kullanici.id },
    data: { epostaDogrulandi: true },
  });

  return "tamam";
}

const METINLER: Record<Sonuc, { baslik: string; aciklama: string }> = {
  tamam: {
    baslik: "E-postanız doğrulandı",
    aciklama: "Hesabınız etkinleşti. Şimdi giriş yapıp bildirimlerinizi ayarlayabilirsiniz.",
  },
  zaten: {
    baslik: "Bu hesap zaten doğrulanmış",
    aciklama: "Doğrudan giriş yapabilirsiniz.",
  },
  gecersiz: {
    baslik: "Bağlantı geçersiz",
    aciklama:
      "Bağlantı hatalı ya da daha önce kullanılmış. Giriş sayfasından yeni bir doğrulama bağlantısı isteyebilirsiniz.",
  },
  "suresi-doldu": {
    baslik: "Bağlantının süresi dolmuş",
    aciklama:
      "Doğrulama bağlantıları 48 saat geçerlidir. Giriş sayfasından yenisini isteyebilirsiniz.",
  },
};

export default async function EpostaDogrulaSayfasi({
  searchParams,
}: {
  searchParams: Promise<{ jeton?: string }>;
}) {
  const { jeton } = await searchParams;
  const sonuc = await jetonuIsle(jeton);
  const metin = METINLER[sonuc];
  const basarili = sonuc === "tamam" || sonuc === "zaten";

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4">
      <Card>
        <CardGovde className="flex flex-col gap-4 p-5">
          <div className="flex flex-col gap-1">
            <h1
              className={`font-baslik text-xl font-semibold ${basarili ? "text-success" : "text-danger"}`}
            >
              {metin.baslik}
            </h1>
            <p className="text-sm text-text-muted">{metin.aciklama}</p>
          </div>

          <Link
            href={basarili ? "/giris?dogrulandi=1" : "/giris"}
            className={butonVaryantlari({ varyant: "birincil", boyut: "md" })}
          >
            Giriş sayfasına git
          </Link>
        </CardGovde>
      </Card>
    </div>
  );
}
