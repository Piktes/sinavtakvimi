import { UstBar } from "@/components/ust-bar";
import { prisma } from "@/lib/prisma";
import { seciliDuzeyId, seciliTema } from "@/lib/tercihler";
import { koleksiyonlar } from "@/lib/veri/ilan";

// Genel site düzeni: üst bar + koleksiyon sekmeleri (§5.3).
export default async function GenelDuzen({ children }: { children: React.ReactNode }) {
  const [sekmeler, duzeyler, duzeyId, tema] = await Promise.all([
    koleksiyonlar(),
    prisma.etiket.findMany({
      where: { tip: "DUZEY", aktifMi: true },
      select: { id: true, ad: true },
      orderBy: { sira: "asc" },
    }),
    seciliDuzeyId(),
    seciliTema(),
  ]);

  return (
    <>
      <UstBar
        koleksiyonlar={sekmeler}
        duzeyler={duzeyler}
        seciliDuzeyId={duzeyId}
        tema={tema}
      />
      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-5">{children}</div>
      <footer className="border-t border-border bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-5 text-xs text-text-muted">
          {/* §7 KVKK: altbilgi metni zorunlu. */}
          Bu site resmî bir kurum sitesi değildir. Tarihler ilgili kurumların duyurularından
          derlenmiştir; bağlayıcı kaynak kurumun kendi duyurusudur.
        </div>
      </footer>
    </>
  );
}
