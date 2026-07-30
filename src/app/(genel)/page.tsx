import Link from "next/link";
import { AnaSayfaV1Kahraman } from "@/components/ana-sayfa/v1-kahraman";
import { AnaSayfaV2 } from "@/components/ana-sayfa/v2-vitrin";
import { AnaSayfaV3 } from "@/components/ana-sayfa/v3-akis";
import { KayanSerit } from "@/components/kayan-serit";
import { DuzeyKarsilama } from "@/components/duzey-karsilama";
import { IlanKarti } from "@/components/ilan-karti";
import { KurumAmblemi } from "@/components/kurum-amblemi";
import { HikayeSeridi } from "@/components/hikaye-seridi";
import { ScrollBelir } from "@/components/scroll-belir";
import { prisma } from "@/lib/prisma";
import { seciliDuzeyId } from "@/lib/tercihler";
import { aktifVersiyon } from "@/lib/versiyon";
import { aktifHikayeler } from "@/lib/veri/hikaye";
import { yaklasanIlanlar } from "@/lib/veri/ilan";

// §5: tek kod tabanı, tek API, tek veri katmanı — fark yalnızca token
// dosyası ve SAYFA DÜZENİ. Veri burada bir kez çekilir, düzen versiyona göre
// seçilir.
export default async function AnaSayfa() {
  const [versiyon, yaklasan, duzeyId, duzeyler, kurumlar, hikayeler] = await Promise.all([
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
      select: { id: true, ad: true, slug: true, logoUrl: true },
      orderBy: { ad: "asc" },
      take: 24,
    }),
    aktifHikayeler(),
  ]);

  const simdi = new Date();
  // Hikaye şeridi, Instagram'daki gibi sayfanın en üstünde — her 3 versiyonda
  // ortak (bkz. karsilama).
  const hikayeSeridi = <HikayeSeridi hikayeler={hikayeler} />;

  // §4.2: düzey seçilmemişse karşılama — her üç versiyonda da zorunlu.
  // Ürünün ne olduğunu anlatan tanıtım cümlesi de yalnızca burada, ilk
  // ziyarette gösterilir — düzeyini seçmiş dönen kullanıcıya her seferinde
  // tekrar anlatılmaz (§4.1: fazlalık değil, işlev önce).
  const karsilama = !duzeyId ? (
    <div className="flex flex-col items-center gap-4">
      <p className="max-w-xl text-center text-sm text-text-muted">
        <strong className="text-text">Sınav Takvimi</strong>, onlarca yayınevi ve eğitim kurumunun
        deneme sınavı tarihlerini tek takvimde toplar. Düzeyini seç, sana uygun sınavları takvimde
        takip et, tarihi yaklaşınca bildirim al.
      </p>
      <DuzeyKarsilama duzeyler={duzeyler} />
    </div>
  ) : null;

  if (versiyon === "v2") {
    return (
      <div className="flex flex-col gap-6">
        {hikayeSeridi}
        {karsilama}
        <AnaSayfaV2 yaklasan={yaklasan} kurumlar={kurumlar} simdi={simdi} />
      </div>
    );
  }

  if (versiyon === "v3") {
    return (
      <div className="flex flex-col gap-5">
        {hikayeSeridi}
        {karsilama}
        <AnaSayfaV3 yaklasan={yaklasan} kurumlar={kurumlar} simdi={simdi} />
      </div>
    );
  }

  // V1 "Ajanda" — varsayılan.
  return (
    <div className="flex flex-col gap-6">
      {hikayeSeridi}
      {karsilama}

      <AnaSayfaV1Kahraman enYakin={yaklasan[0]} simdi={simdi} />

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
            {yaklasan.slice(0, 6).map((ilan, index) => (
              <ScrollBelir key={ilan.id} gecikme={(index % 2) * 80}>
                <IlanKarti ilan={ilan} simdi={simdi} />
              </ScrollBelir>
            ))}
          </div>
        )}
      </section>

      {/* §5.9: yayınevi logo duvarı. Gerçek logolar yüklenene kadar §3.6'daki
       * renk imiyle üretilen amblem gösteriliyor (bkz. KurumAmblemi). */}
      <ScrollBelir as="section" className="flex flex-col gap-3">
        <h2 className="font-baslik text-xl font-semibold text-text">Yayınevleri</h2>
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
          {kurumlar.map((kurum) => (
            <li key={kurum.id}>
              <KurumAmblemi kurum={kurum} />
            </li>
          ))}
        </ul>
      </ScrollBelir>
    </div>
  );
}
