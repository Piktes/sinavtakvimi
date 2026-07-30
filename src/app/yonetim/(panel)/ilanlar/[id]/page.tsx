import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { requireRol } from "@/lib/rbac";
import { IlanFormu } from "../ilan-formu";
import { formSecenekleri } from "../secenekler";

export const metadata: Metadata = { title: "İlanı düzenle" };

// Date → <input type="date"> değeri. @db.Date UTC gece yarısı olarak gelir.
function gunDegeri(tarih: Date | null): string | null {
  return tarih ? tarih.toISOString().slice(0, 10) : null;
}

// UTC → Europe/Istanbul duvar saati, <input type="datetime-local"> için.
function yerelZamanDegeri(tarih: Date | null): string | null {
  if (!tarih) return null;
  return new Date(tarih.getTime() + 3 * 60 * 60 * 1000).toISOString().slice(0, 16);
}

export default async function IlanDuzenleSayfasi({ params }: { params: Promise<{ id: string }> }) {
  await requireRol(["ADMIN", "EDITOR"]);
  const { id } = await params;

  const [ilan, secenekler] = await Promise.all([
    prisma.ilan.findUnique({
      where: { id },
      include: {
        duzeyler: { select: { id: true } },
        oturumlar: { orderBy: { sira: "asc" } },
      },
    }),
    formSecenekleri(),
  ]);

  if (!ilan) notFound();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-baslik text-2xl font-semibold text-text">İlanı düzenle</h1>
        <Button varyant="ikincil" boyut="sm">
          <Link href={`/yonetim/ilanlar/${ilan.id}/onizleme`}>Önizle</Link>
        </Button>
      </div>

      <IlanFormu
        secenekler={secenekler}
        ilan={{
          id: ilan.id,
          baslik: ilan.baslik,
          slug: ilan.slug,
          seriNo: ilan.seriNo,
          kurumId: ilan.kurumId,
          dagiticiKurumId: ilan.dagiticiKurumId,
          grupId: ilan.grupId,
          formatId: ilan.formatId,
          duzeyIds: ilan.duzeyler.map((d) => d.id),
          sinavTarihi: gunDegeri(ilan.sinavTarihi)!,
          sinavBitisTarihi: gunDegeri(ilan.sinavBitisTarihi),
          saat: ilan.saat,
          sonSiparisTarihi: gunDegeri(ilan.sonSiparisTarihi),
          cevapAnahtariZamani: yerelZamanDegeri(ilan.cevapAnahtariZamani),
          uygulamaTipi: ilan.uygulamaTipi,
          zorluk: ilan.zorluk,
          aciklamaMd: ilan.aciklamaMd,
          afisUrl: ilan.afisUrl,
          detayUrl: ilan.detayUrl,
          sezon: ilan.sezon,
          oneCikar: ilan.oneCikar,
          yayinDurumu: ilan.yayinDurumu,
          oturumlar: ilan.oturumlar.map((o) => ({
            ad: o.ad,
            saat: o.saat,
            sureDk: o.sureDk,
            soruSayisi: o.soruSayisi,
          })),
        }}
      />
    </div>
  );
}
