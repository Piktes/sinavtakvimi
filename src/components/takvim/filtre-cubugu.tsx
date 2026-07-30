"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/cn";
import { ILLER } from "@/lib/iller";
import { kurumRengi } from "@/lib/kurum-tonu";
import type { AktifFiltre, Siralama } from "@/components/takvim/filtre-mantigi";
import { aktifFiltreSayisi } from "@/components/takvim/filtre-mantigi";

export interface FiltreSecenekleri {
  kurumlar: { id: string; ad: string; slug: string; logoUrl: string | null }[];
  formatlar: { id: string; ad: string; slug: string }[];
  duzeyler: { id: string; ad: string; slug: string }[];
}

const ZORLUKLAR = [
  { deger: "KOLAY", ad: "Kolay" },
  { deger: "ORTA", ad: "Orta" },
  { deger: "ZOR", ad: "Zor" },
];

const UYGULAMALAR = [
  { deger: "TURKIYE_GENELI", ad: "Türkiye Geneli" },
  { deger: "KURUMSAL", ad: "Kurumsal" },
];

// §4.3: aktif filtreler ROZET olarak görünür, tek tıkla kalkar.
export function FiltreCubugu({
  secenekler,
  filtre,
  siralama,
  gorunum,
  onFiltreDegis,
  onSiralamaDegis,
  onGorunumDegis,
}: {
  secenekler: FiltreSecenekleri;
  filtre: AktifFiltre;
  siralama: Siralama;
  gorunum: "aylik" | "liste";
  onFiltreDegis: (yeni: AktifFiltre) => void;
  onSiralamaDegis: (yeni: Siralama) => void;
  onGorunumDegis: (yeni: "aylik" | "liste") => void;
}) {
  const sayi = aktifFiltreSayisi(filtre);
  // §4.5: beş facet listesi açıkken takvimi/listeyi aşağı itiyordu — mobilde
  // tüm ekranı kaplıyordu. Artık HER ekran boyutunda varsayılan KAPALI,
  // "Filtrele" düğmesiyle açılır.
  const [filtreAcik, setFiltreAcik] = useState(false);

  function coklukDegistir(alan: keyof AktifFiltre, deger: string) {
    const mevcut = filtre[alan];
    const yeni = mevcut.includes(deger) ? mevcut.filter((d) => d !== deger) : [...mevcut, deger];
    onFiltreDegis({ ...filtre, [alan]: yeni });
  }

  const rozetler: { alan: keyof AktifFiltre; deger: string; etiket: string }[] = [
    ...filtre.kurumlar.map((slug) => ({
      alan: "kurumlar" as const,
      deger: slug,
      etiket: secenekler.kurumlar.find((k) => k.slug === slug)?.ad ?? slug,
    })),
    ...filtre.formatlar.map((slug) => ({
      alan: "formatlar" as const,
      deger: slug,
      etiket: secenekler.formatlar.find((f) => f.slug === slug)?.ad ?? slug,
    })),
    ...filtre.duzeyler.map((slug) => ({
      alan: "duzeyler" as const,
      deger: slug,
      etiket: secenekler.duzeyler.find((d) => d.slug === slug)?.ad ?? slug,
    })),
    ...filtre.zorluklar.map((deger) => ({
      alan: "zorluklar" as const,
      deger,
      etiket: ZORLUKLAR.find((z) => z.deger === deger)?.ad ?? deger,
    })),
    ...filtre.uygulamaTipleri.map((deger) => ({
      alan: "uygulamaTipleri" as const,
      deger,
      etiket: UYGULAMALAR.find((u) => u.deger === deger)?.ad ?? deger,
    })),
    ...filtre.iller.map((deger) => ({
      alan: "iller" as const,
      deger,
      etiket: deger,
    })),
  ];

  return (
    <div className="yapiskan-ust z-20 flex flex-col gap-3 rounded-md border border-border bg-surface p-3">
      <div className="flex flex-wrap items-center gap-3">
        {/* §4.4: mobilde ızgara kullanılmaz, her zaman liste gösterilir —
         * bu yüzden görünüm seçici orada gizli. Açık kalsaydı "Aylık" seçili
         * görünürken liste gösterilir, kontrol yalan söylerdi. */}
        <div className="hidden items-center gap-1 md:flex">
          <span className="text-sm text-text-muted">Görünüm:</span>
          <Button
            varyant={gorunum === "aylik" ? "birincil" : "hayalet"}
            boyut="sm"
            onClick={() => onGorunumDegis("aylik")}
          >
            Aylık
          </Button>
          <Button
            varyant={gorunum === "liste" ? "birincil" : "hayalet"}
            boyut="sm"
            onClick={() => onGorunumDegis("liste")}
          >
            Liste
          </Button>
        </div>

        <Button
          varyant={filtreAcik ? "birincil" : "ikincil"}
          boyut="sm"
          aria-expanded={filtreAcik}
          onClick={() => setFiltreAcik((onceki) => !onceki)}
        >
          <SlidersHorizontal size={16} strokeWidth={1.75} aria-hidden />
          Filtrele{sayi > 0 ? ` (${sayi})` : ""}
        </Button>

        <div className="flex items-center gap-2">
          <label htmlFor="sirala" className="text-sm text-text-muted">
            Sırala:
          </label>
          <Select
            id="sirala"
            value={siralama}
            onChange={(olay) => onSiralamaDegis(olay.target.value as Siralama)}
            className="w-36"
          >
            <option value="tarih">Tarih</option>
            <option value="yayinevi">Yayınevi</option>
          </Select>
        </div>
      </div>

      <div
        className={cn("grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5", !filtreAcik && "hidden")}
      >
        <CokluSecim
          etiket="Yayınevi"
          secenekler={secenekler.kurumlar.map((k) => ({ deger: k.slug, ad: k.ad }))}
          secili={filtre.kurumlar}
          onDegis={(deger) => coklukDegistir("kurumlar", deger)}
          renkli
        />
        <CokluSecim
          etiket="Format"
          secenekler={secenekler.formatlar.map((f) => ({ deger: f.slug, ad: f.ad }))}
          secili={filtre.formatlar}
          onDegis={(deger) => coklukDegistir("formatlar", deger)}
        />
        <CokluSecim
          etiket="Zorluk"
          secenekler={ZORLUKLAR}
          secili={filtre.zorluklar}
          onDegis={(deger) => coklukDegistir("zorluklar", deger)}
        />
        <CokluSecim
          etiket="Uygulama"
          secenekler={UYGULAMALAR}
          secili={filtre.uygulamaTipleri}
          onDegis={(deger) => coklukDegistir("uygulamaTipleri", deger)}
        />
        <CokluSecim
          etiket="İl"
          secenekler={ILLER.map((il) => ({ deger: il, ad: il }))}
          secili={filtre.iller}
          onDegis={(deger) => coklukDegistir("iller", deger)}
        />
      </div>

      {sayi > 0 && (
        <div className="flex flex-wrap items-center gap-1 border-t border-border pt-2">
          <span className="text-sm text-text-muted">Aktif:</span>
          {rozetler.map((rozet) => (
            <button
              key={`${rozet.alan}-${rozet.deger}`}
              type="button"
              onClick={() => coklukDegistir(rozet.alan, rozet.deger)}
              aria-label={`${rozet.etiket} filtresini kaldır`}
              className="inline-flex"
            >
              <Badge varyant="cizgi" className="gap-1">
                {rozet.etiket}
                <X size={12} strokeWidth={1.75} aria-hidden />
              </Badge>
            </button>
          ))}
          <Button
            varyant="bag"
            boyut="sm"
            className="ml-auto"
            onClick={() =>
              onFiltreDegis({
                kurumlar: [],
                formatlar: [],
                duzeyler: [],
                zorluklar: [],
                uygulamaTipleri: [],
                iller: [],
              })
            }
          >
            Temizle
          </Button>
        </div>
      )}
    </div>
  );
}

// Türkçe arama: büyük/küçük harf ve aksan farkını yok sayar ("ı/i", "ş/s"…).
// `localeCompare` yerine normalize, çünkü burada sıralama değil ARAMA var.
function aramaAnahtari(metin: string): string {
  return metin
    .toLocaleLowerCase("tr-TR")
    .replaceAll("ı", "i")
    .replaceAll("ğ", "g")
    .replaceAll("ü", "u")
    .replaceAll("ş", "s")
    .replaceAll("ö", "o")
    .replaceAll("ç", "c");
}

// §4.3: yayınevi seçici arama kutusu + çoklu seçim. 47 kurum / 81 il için düz
// metin listesi yerine renk imli, ARANABİLİR liste. Arama kutusu yalnızca
// liste uzunsa (8+) gösterilir — kısa listelerde gereksiz gürültü olurdu.
function CokluSecim({
  etiket,
  secenekler,
  secili,
  onDegis,
  renkli = false,
}: {
  etiket: string;
  secenekler: { deger: string; ad: string }[];
  secili: string[];
  onDegis: (deger: string) => void;
  renkli?: boolean;
}) {
  const [arama, setArama] = useState("");
  const aramaGoster = secenekler.length >= 8;

  const gosterilecek = arama
    ? secenekler.filter((s) => aramaAnahtari(s.ad).includes(aramaAnahtari(arama)))
    : secenekler;

  return (
    <fieldset className="flex flex-col gap-1">
      <legend className="text-xs font-medium text-text-muted">{etiket}</legend>

      {aramaGoster && (
        <div className="relative">
          <Search
            size={16}
            strokeWidth={1.75}
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-2 -translate-y-1/2 text-text-faint"
          />
          <Input
            type="search"
            value={arama}
            onChange={(olay) => setArama(olay.target.value)}
            aria-label={`${etiket} içinde ara`}
            placeholder="Ara…"
            className="h-kontrol-sm pl-8 text-sm"
          />
        </div>
      )}

      <div className="max-h-32 overflow-y-auto rounded-sm border border-border p-1">
        {gosterilecek.length === 0 && (
          <p className="px-2 py-1 text-xs text-text-muted">Eşleşme yok.</p>
        )}
        {gosterilecek.map((secenek) => (
          <label
            key={secenek.deger}
            className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1 text-sm text-text transition-colors hover:bg-surface-hover"
          >
            <input
              type="checkbox"
              checked={secili.includes(secenek.deger)}
              onChange={() => onDegis(secenek.deger)}
            />
            {renkli && (
              <span
                aria-hidden
                style={kurumRengi(secenek.deger)}
                className="kurum-zemin size-2 shrink-0 rounded-sm"
              />
            )}
            <span className="truncate">{secenek.ad}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
