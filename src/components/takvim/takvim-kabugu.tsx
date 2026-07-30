"use client";

import { CalendarX, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AylikIzgara, type TakvimNotuOzet } from "@/components/takvim/aylik-izgara";
import { FiltreCubugu, type FiltreSecenekleri } from "@/components/takvim/filtre-cubugu";
import {
  ilanlariFiltrele,
  ilanlariSirala,
  filtreyiUrleYaz,
  type AktifFiltre,
  type Siralama,
} from "@/components/takvim/filtre-mantigi";
import { ListeGorunumu } from "@/components/takvim/liste-gorunumu";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatAyYil } from "@/lib/tarih";
import type { IlanOzet } from "@/lib/veri/ilan";

// §4.3: ayın ilanları sunucudan BİR KEZ gelir, filtreler istemcide uygulanır —
// tuşa basınca sonuç anında değişir, iskelet yanıp sönmez. Ay değişince
// sunucudan yeni veri (Link ile gezinme).
export function TakvimKabugu({
  yil,
  ay,
  ilanlar,
  takvimNotlari,
  secenekler,
  baslangicFiltresi,
  baslangicSiralamasi,
  baslangicGorunumu,
  bugun,
  simdiIso,
}: {
  yil: number;
  ay: number;
  ilanlar: IlanOzet[];
  takvimNotlari: TakvimNotuOzet[];
  secenekler: FiltreSecenekleri;
  baslangicFiltresi: AktifFiltre;
  baslangicSiralamasi: Siralama;
  baslangicGorunumu: "aylik" | "liste";
  bugun: string;
  simdiIso: string;
}) {
  const yonlendirici = useRouter();
  const yol = usePathname();

  const [filtre, setFiltre] = useState(baslangicFiltresi);
  const [siralama, setSiralama] = useState(baslangicSiralamasi);
  const [gorunum, setGorunum] = useState(baslangicGorunumu);

  // Sunucudan gelen "şu an" — §4.5: geri sayım istemci saatine güvenmez.
  const simdi = useMemo(() => new Date(simdiIso), [simdiIso]);

  const gosterilecek = useMemo(
    () => ilanlariSirala(ilanlariFiltrele(ilanlar, filtre), siralama),
    [ilanlar, filtre, siralama],
  );

  // §4.3: filtre durumu URL'e yazılır — paylaşılabilir, geri tuşu çalışır.
  // `replace` kullanılıyor ki her tıklama geçmişe ayrı kayıt düşmesin.
  function urlYaz(yeniFiltre: AktifFiltre, yeniSiralama: Siralama, yeniGorunum: string) {
    const params = filtreyiUrleYaz(yeniFiltre, yeniSiralama);
    if (yeniGorunum !== "aylik") params.set("gorunum", yeniGorunum);
    const sorgu = params.toString();
    yonlendirici.replace(sorgu ? `${yol}?${sorgu}` : yol, { scroll: false });
  }

  const oncekiAy = ay === 1 ? { yil: yil - 1, ay: 12 } : { yil, ay: ay - 1 };
  const sonrakiAy = ay === 12 ? { yil: yil + 1, ay: 1 } : { yil, ay: ay + 1 };
  const ayBagi = (hedef: { yil: number; ay: number }) =>
    `/takvim/${hedef.yil}/${String(hedef.ay).padStart(2, "0")}`;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-baslik text-xl font-semibold text-text">{formatAyYil(yil, ay)}</h1>
        <div className="flex items-center gap-1">
          <Button
            varyant="ikincil"
            boyut="ikonSm"
            aria-label="Önceki ay"
            onClick={() => yonlendirici.push(ayBagi(oncekiAy))}
          >
            <ChevronLeft size={16} strokeWidth={1.75} aria-hidden />
          </Button>
          <Button
            varyant="ikincil"
            boyut="ikonSm"
            aria-label="Sonraki ay"
            onClick={() => yonlendirici.push(ayBagi(sonrakiAy))}
          >
            <ChevronRight size={16} strokeWidth={1.75} aria-hidden />
          </Button>
        </div>
      </div>

      <FiltreCubugu
        secenekler={secenekler}
        filtre={filtre}
        siralama={siralama}
        gorunum={gorunum}
        onFiltreDegis={(yeni) => {
          setFiltre(yeni);
          urlYaz(yeni, siralama, gorunum);
        }}
        onSiralamaDegis={(yeni) => {
          setSiralama(yeni);
          urlYaz(filtre, yeni, gorunum);
        }}
        onGorunumDegis={(yeni) => {
          setGorunum(yeni);
          urlYaz(filtre, siralama, yeni);
        }}
      />

      <p className="sayisal text-sm text-text-muted">{gosterilecek.length} ilan</p>

      {gosterilecek.length === 0 ? (
        // §4.5: boş durum TASARLANMIŞ — sebep + çıkış yolu.
        <EmptyState
          ikon={CalendarX}
          baslik="Bu filtrelerde ilan yok"
          aciklama={
            ilanlar.length > 0
              ? `${formatAyYil(yil, ay)} ayında ${ilanlar.length} ilan var, ancak seçtiğin filtrelere uymuyor.`
              : "Bu ayda hiç ilan yok. Başka bir aya göz atabilirsin."
          }
          eylem={
            <div className="flex gap-2">
              {ilanlar.length > 0 && (
                <Button
                  varyant="ikincil"
                  boyut="sm"
                  onClick={() => {
                    const bos = {
                      kurumlar: [],
                      formatlar: [],
                      duzeyler: [],
                      zorluklar: [],
                      uygulamaTipleri: [],
                    };
                    setFiltre(bos);
                    urlYaz(bos, siralama, gorunum);
                  }}
                >
                  Filtreleri temizle
                </Button>
              )}
              <Button varyant="hayalet" boyut="sm" onClick={() => yonlendirici.push(ayBagi(sonrakiAy))}>
                Sonraki aya bak
              </Button>
            </div>
          }
        />
      ) : gorunum === "aylik" ? (
        <>
          {/* §4.4: aylık ızgara mobilde kullanışsız — orada liste gösterilir. */}
          <div className="hidden md:block">
            <AylikIzgara
              yil={yil}
              ay={ay}
              ilanlar={gosterilecek}
              takvimNotlari={takvimNotlari}
              bugun={bugun}
            />
          </div>
          <div className="md:hidden">
            <ListeGorunumu ilanlar={gosterilecek} simdi={simdi} />
          </div>
        </>
      ) : (
        <ListeGorunumu ilanlar={gosterilecek} simdi={simdi} />
      )}

      <nav className="flex items-center justify-between border-t border-border pt-3">
        <Link href={ayBagi(oncekiAy)} className="text-sm text-text-muted hover:underline">
          ← {formatAyYil(oncekiAy.yil, oncekiAy.ay)}
        </Link>
        <Link href={ayBagi(sonrakiAy)} className="text-sm text-text-muted hover:underline">
          {formatAyYil(sonrakiAy.yil, sonrakiAy.ay)} →
        </Link>
      </nav>
    </div>
  );
}
