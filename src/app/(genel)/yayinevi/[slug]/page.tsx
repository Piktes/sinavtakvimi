import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarX } from "lucide-react";
import { IlanKarti } from "@/components/ilan-karti";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { kurumRengi } from "@/lib/kurum-tonu";
import { prisma } from "@/lib/prisma";
import { kurumunIlanlari } from "@/lib/veri/ilan";

// §4.6: SEO açısından en değerli sayfa — "özdebir deneme takvimi",
// "paraf deneme tarihleri" gibi aramalar yüksek hacimli.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const kurum = await prisma.kurum.findUnique({ where: { slug }, select: { ad: true } });
  if (!kurum) return { title: "Yayınevi bulunamadı" };

  return {
    title: `${kurum.ad} Deneme Takvimi`,
    description: `${kurum.ad} deneme sınavı tarihleri, son sipariş ve cevap anahtarı bilgileri.`,
  };
}

export default async function YayineviSayfasi({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const kurum = await prisma.kurum.findUnique({
    where: { slug },
    select: {
      id: true,
      ad: true,
      slug: true,
      webSitesi: true,
      aciklamaMd: true,
      aktifMi: true,
      tip: { select: { ad: true } },
    },
  });
  if (!kurum || !kurum.aktifMi) notFound();

  const ilanlar = await kurumunIlanlari(slug);
  const simdi = new Date();
  const bugun = simdi.toISOString().slice(0, 10);

  const yaklasanlar = ilanlar.filter((ilan) => ilan.sinavTarihi >= bugun);
  const gecmisler = ilanlar.filter((ilan) => ilan.sinavTarihi < bugun).reverse();

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center gap-3">
        <span
          aria-hidden
          style={kurumRengi(kurum.slug)}
          className="kurum-zemin size-10 shrink-0 rounded-md"
        />
        <div>
          <h1 className="font-baslik text-2xl font-bold text-text">{kurum.ad}</h1>
          <div className="mt-1 flex items-center gap-2">
            <Badge varyant="cizgi">{kurum.tip.ad}</Badge>
            <span className="sayisal text-sm text-text-muted">{ilanlar.length} ilan</span>
          </div>
        </div>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="font-baslik text-lg font-semibold text-text">Yaklaşan sınavlar</h2>
        {yaklasanlar.length === 0 ? (
          <EmptyState
            ikon={CalendarX}
            baslik="Yaklaşan ilan yok"
            aciklama={`${kurum.ad} için henüz gelecek tarihli bir ilan yayınlanmadı.`}
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {yaklasanlar.map((ilan) => (
              <IlanKarti key={ilan.id} ilan={ilan} simdi={simdi} />
            ))}
          </div>
        )}
      </section>

      {/* §7: tarihi geçen ilan silinmez, arşive alınır. */}
      {gecmisler.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="font-baslik text-lg font-semibold text-text">Geçmiş sınavlar</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {gecmisler.slice(0, 8).map((ilan) => (
              <IlanKarti key={ilan.id} ilan={ilan} simdi={simdi} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
