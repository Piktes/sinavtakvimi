import Link from "next/link";
import { AnaSayfaV2 } from "@/components/ana-sayfa/v2-vitrin";
import { AnaSayfaV3 } from "@/components/ana-sayfa/v3-akis";
import { KayanSerit } from "@/components/kayan-serit";
import { DuzeyKarsilama } from "@/components/duzey-karsilama";
import { IlanKarti } from "@/components/ilan-karti";
import { kurumRengi } from "@/lib/kurum-tonu";
import { prisma } from "@/lib/prisma";
import { seciliDuzeyId } from "@/lib/tercihler";
import { aktifVersiyon } from "@/lib/versiyon";
import { yaklasanIlanlar } from "@/lib/veri/ilan";

// §5: tek kod tabanı, tek API, tek veri katmanı — fark yalnızca token
// dosyası ve SAYFA DÜZENİ. Veri burada bir kez çekilir, düzen versiyona göre
// seçilir.
export default async function AnaSayfa() {
  const [versiyon, yaklasan, duzeyId, duzeyler, kurumlar] = await Promise.all([
    aktifVersiyon(),
    yaklasanIlanlar(7, 12),
    seciliDuzeyId(),
    prisma.etiket.findMany({
      where: { tip: "DUZEY", aktifMi: true },
      select: { id: true, ad: true },
      orderBy: { sira: "asc" },
    }),
    prisma.kurum.findMany({
      where: { aktifMi: true, ilanlar: { some: { yayinDurumu: "YAYINDA" } } },
      select: { id: true, ad: true, slug: true },
      orderBy: { ad: "asc" },
      take: 24,
    }),
  ]);

  const simdi = new Date();

  // §4.2: düzey seçilmemişse karşılama — her üç versiyonda da zorunlu.
  const karsilama = !duzeyId ? <DuzeyKarsilama duzeyler={duzeyler} /> : null;

  if (versiyon === "v2") {
    return (
      <div className="flex flex-col gap-6">
        {karsilama}
        <AnaSayfaV2 yaklasan={yaklasan} kurumlar={kurumlar} simdi={simdi} />
      </div>
    );
  }

  if (versiyon === "v3") {
    return (
      <div className="flex flex-col gap-5">
        {karsilama}
        <AnaSayfaV3 yaklasan={yaklasan} simdi={simdi} />
      </div>
    );
  }

  // V1 "Ajanda" — varsayılan.
  return (
    <div className="flex flex-col gap-6">
      {karsilama}

      {/* §4.5: 7 gün içindeki ilanlar. Boşsa tamamen gizlenir. */}
      <div className="-mx-4">
        <KayanSerit ilanlar={yaklasan} simdi={simdi} />
      </div>

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h2 className="font-baslik text-xl font-semibold text-text">Yaklaşan sınavlar</h2>
          <Link href="/takvim" className="text-sm text-text-muted hover:underline">
            Takvimin tamamı →
          </Link>
        </div>

        {yaklasan.length === 0 ? (
          <p className="text-sm text-text-muted">Önümüzdeki 7 günde ilan yok.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {yaklasan.slice(0, 6).map((ilan) => (
              <IlanKarti key={ilan.id} ilan={ilan} simdi={simdi} />
            ))}
          </div>
        )}
      </section>

      {/* §5.9: yayınevi logo duvarı. Logolar henüz yüklenmediği için
       * §3.6'daki renk imiyle marka adı gösteriliyor. */}
      <section className="flex flex-col gap-3">
        <h2 className="font-baslik text-xl font-semibold text-text">Yayınevleri</h2>
        <ul className="flex flex-wrap gap-2">
          {kurumlar.map((kurum) => (
            <li key={kurum.id}>
              <Link
                href={`/yayinevi/${kurum.slug}`}
                className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm text-text transition-colors hover:bg-surface-hover"
              >
                <span
                  aria-hidden
                  style={kurumRengi(kurum.slug)}
                  className="kurum-zemin size-2 rounded-sm"
                />
                {kurum.ad}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
