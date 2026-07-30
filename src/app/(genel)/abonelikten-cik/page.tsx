import type { Metadata } from "next";
import Link from "next/link";
import { butonVaryantlari } from "@/components/ui/button";
import { Card, CardGovde } from "@/components/ui/card";
import { imzaliJetonCoz } from "@/lib/imzali-baglanti";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Abonelikten çık", robots: { index: false } };

// §4.8: "Her e-postada giriş gerektirmeyen imzalı abonelikten çık bağlantısı."
// Giriş İSTENMEZ — kullanıcı e-postayı telefonundan açıp tek dokunuşla
// çıkabilmeli. Güvenliği HMAC imzası sağlıyor (lib/imzali-baglanti.ts).
export const dynamic = "force-dynamic";

type Sonuc = "cikildi" | "zaten-yok" | "gecersiz";

async function jetonuIsle(jeton: string | undefined): Promise<{ sonuc: Sonuc; ad?: string }> {
  if (!jeton) return { sonuc: "gecersiz" };

  const yuk = imzaliJetonCoz(jeton);
  if (!yuk || yuk.eylem !== "cik" || !yuk.abonelikId) return { sonuc: "gecersiz" };

  const abonelik = await prisma.abonelik.findUnique({
    where: { id: yuk.abonelikId },
    select: {
      id: true,
      ilan: { select: { baslik: true } },
      kurum: { select: { ad: true } },
      koleksiyon: { select: { ad: true } },
    },
  });

  // Zaten silinmişse hata değil: kullanıcının istediği son durum sağlanmış.
  if (!abonelik) return { sonuc: "zaten-yok" };

  const ad = abonelik.ilan?.baslik ?? abonelik.kurum?.ad ?? abonelik.koleksiyon?.ad;
  await prisma.abonelik.delete({ where: { id: abonelik.id } });

  return { sonuc: "cikildi", ad };
}

export default async function AbonelikCikisSayfasi({
  searchParams,
}: {
  searchParams: Promise<{ jeton?: string }>;
}) {
  const { jeton } = await searchParams;
  const { sonuc, ad } = await jetonuIsle(jeton);

  const metin = {
    cikildi: {
      baslik: "Abonelik kapatıldı",
      aciklama: ad
        ? `“${ad}” için artık hatırlatma göndermeyeceğiz.`
        : "Bu abonelik için artık hatırlatma göndermeyeceğiz.",
    },
    "zaten-yok": {
      baslik: "Abonelik zaten kapalı",
      aciklama: "Bu abonelik daha önce kaldırılmış. Yapılacak bir şey yok.",
    },
    gecersiz: {
      baslik: "Bağlantı geçersiz",
      aciklama:
        "Bağlantı hatalı görünüyor. Hesabınıza giriş yapıp bildirimlerinizi oradan yönetebilirsiniz.",
    },
  }[sonuc];

  const basarili = sonuc !== "gecersiz";

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

          <div className="flex flex-wrap gap-2">
            <Link
              href="/hesabim"
              className={butonVaryantlari({ varyant: "birincil", boyut: "md" })}
            >
              Bildirimlerimi yönet
            </Link>
            <Link href="/" className={butonVaryantlari({ varyant: "ikincil", boyut: "md" })}>
              Ana sayfa
            </Link>
          </div>
        </CardGovde>
      </Card>
    </div>
  );
}
