import { AltSekmeCubugu } from "@/components/alt-sekme-cubugu";
import { SosyalIkonSatiri } from "@/components/sosyal-ikon-satiri";
import { UstBar } from "@/components/ust-bar";
import { prisma } from "@/lib/prisma";
import { seciliDuzeyId, seciliTema } from "@/lib/tercihler";
import { aktifVersiyon, VERSIYON_ADLARI } from "@/lib/versiyon";
import { aktifSosyalBaglantilar } from "@/lib/veri/sosyal";
import { koleksiyonlar } from "@/lib/veri/ilan";

// Genel site düzeni: üst bar + koleksiyon sekmeleri (§5.3).
// §5: üç versiyon tek kod tabanı — düzen farkları versiyona göre burada
// ve ana sayfada; bileşenler versiyonu bilmez, token'ları okur.
export default async function GenelDuzen({ children }: { children: React.ReactNode }) {
  const [sekmeler, duzeyler, duzeyId, tema, versiyon, sosyalBaglantilar] = await Promise.all([
    koleksiyonlar(),
    prisma.etiket.findMany({
      where: { tip: "DUZEY", aktifMi: true },
      select: { id: true, ad: true },
      orderBy: { sira: "asc" },
    }),
    seciliDuzeyId(),
    seciliTema(),
    aktifVersiyon(),
    aktifSosyalBaglantilar(),
  ]);

  return (
    <>
      <UstBar koleksiyonlar={sekmeler} duzeyler={duzeyler} seciliDuzeyId={duzeyId} tema={tema} />

      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-5">{children}</div>

      <footer className="border-t border-border bg-surface">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-5 text-xs text-text-muted">
          {/* §7 KVKK: altbilgi metni zorunlu. */}
          <p>
            Bu site resmî bir kurum sitesi değildir. Tarihler ilgili kurumların duyurularından
            derlenmiştir; bağlayıcı kaynak kurumun kendi duyurusudur.
          </p>
          <SosyalIkonSatiri baglantilar={sosyalBaglantilar} />

          {/* §5: `?tema=v2` ile önizleme. Aktif versiyon Ayar tablosundan;
           * bu bağlantılar geliştirme/önizleme kolaylığı için. */}
          <p className="flex items-center gap-2">
            <span>Görünüm: {VERSIYON_ADLARI[versiyon]}</span>
            <a href="?tema=v1" className="hover:underline">
              v1
            </a>
            <a href="?tema=v2" className="hover:underline">
              v2
            </a>
            <a href="?tema=v3" className="hover:underline">
              v3
            </a>
          </p>
        </div>
      </footer>

      {/* Alt sekme çubuğu (mobilde) — başlangıçta yalnızca V3 imzasıydı, mobil
       * gezinmede belirgin fayda sağladığı için üç versiyonda da açık. */}
      <AltSekmeCubugu />
    </>
  );
}
