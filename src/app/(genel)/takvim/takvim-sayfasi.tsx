import { TakvimKabugu } from "@/components/takvim/takvim-kabugu";
import { urldenFiltreOku, type Siralama } from "@/components/takvim/filtre-mantigi";
import type { Prisma } from "@/generated/prisma/client";
import { seciliDuzeyId } from "@/lib/tercihler";
import { ayinIlanlari, ayinTakvimNotlari, filtreSecenekleri } from "@/lib/veri/ilan";
import { aktifVersiyon } from "@/lib/versiyon";
import { prisma } from "@/lib/prisma";

// /takvim ve /takvim/[yil]/[ay] ile /k/[slug] aynı gövdeyi paylaşır.
export async function TakvimSayfasi({
  yil,
  ay,
  aramaParametreleri,
  ekFiltre,
  baslik,
  baslikEylemi,
}: {
  yil: number;
  ay: number;
  aramaParametreleri: Record<string, string | string[] | undefined>;
  ekFiltre?: Prisma.IlanWhereInput;
  baslik?: string;
  /** Başlık satırının sağına yerleşen eylem (ör. takvim akışı düğmesi). */
  baslikEylemi?: React.ReactNode;
}) {
  const params = new URLSearchParams();
  for (const [anahtar, deger] of Object.entries(aramaParametreleri)) {
    if (typeof deger === "string") params.set(anahtar, deger);
  }

  const [ilanlar, takvimNotlari, secenekler, duzeyId, versiyon] = await Promise.all([
    ayinIlanlari(yil, ay, ekFiltre),
    ayinTakvimNotlari(yil, ay),
    filtreSecenekleri(),
    seciliDuzeyId(),
    aktifVersiyon(),
  ]);

  // §4.2: kullanıcının kalıcı düzey seçimi VARSAYILAN filtredir. URL'de açık
  // bir düzey filtresi varsa o öncelikli — paylaşılan bağlantı kişisel
  // tercihle ezilmemeli.
  const urlFiltresi = urldenFiltreOku(params);
  if (urlFiltresi.duzeyler.length === 0 && duzeyId) {
    const duzey = await prisma.etiket.findUnique({
      where: { id: duzeyId },
      select: { slug: true },
    });
    if (duzey) urlFiltresi.duzeyler = [duzey.slug];
  }

  const siralama: Siralama = params.get("sirala") === "yayinevi" ? "yayinevi" : "tarih";

  // §5 V3 "Akış": liste varsayılan görünüm. URL'de açık seçim varsa o kazanır.
  const urlGorunumu = params.get("gorunum");
  const gorunum: "aylik" | "liste" =
    urlGorunumu === "liste"
      ? "liste"
      : urlGorunumu === "aylik"
        ? "aylik"
        : versiyon === "v3"
          ? "liste"
          : "aylik";

  const simdi = new Date();

  return (
    <div className="flex flex-col gap-4">
      {(baslik || baslikEylemi) && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          {baslik && <h2 className="font-baslik text-2xl font-semibold text-text">{baslik}</h2>}
          {baslikEylemi}
        </div>
      )}
      <TakvimKabugu
        yil={yil}
        ay={ay}
        ilanlar={ilanlar}
        takvimNotlari={takvimNotlari.map((not) => ({
          ...not,
          baslangic: not.baslangic.toISOString().slice(0, 10),
          bitis: not.bitis.toISOString().slice(0, 10),
        }))}
        secenekler={secenekler}
        baslangicFiltresi={urlFiltresi}
        baslangicSiralamasi={siralama}
        baslangicGorunumu={gorunum}
        bugun={simdi.toISOString().slice(0, 10)}
        simdiIso={simdi.toISOString()}
      />
    </div>
  );
}
