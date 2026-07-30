import Link from "next/link";
import { IlanKarti } from "@/components/ilan-karti";
import { cn } from "@/lib/cn";
import { formatKisa, gunAnahtari } from "@/lib/tarih";
import type { IlanOzet } from "@/lib/veri/ilan";

// §5 V3 "Akış": uygulama gibi, mobil öncelikli tek sütun akış.
// İmza: üstte yatay kaydırmalı hafta şeridi (gün gün, o günün ilan sayısı
// noktalarla). Alt sekme çubuğu düzen bileşeninde.
export function AnaSayfaV3({ yaklasan, simdi }: { yaklasan: IlanOzet[]; simdi: Date }) {
  const bugun = gunAnahtari(simdi);

  // Önümüzdeki 14 gün — şerit için.
  const gunler = Array.from({ length: 14 }, (_, index) => {
    const tarih = new Date(simdi);
    tarih.setUTCDate(tarih.getUTCDate() + index);
    const anahtar = gunAnahtari(tarih);
    return {
      anahtar,
      tarih,
      sayi: yaklasan.filter((ilan) => ilan.sinavTarihi === anahtar).length,
    };
  });

  return (
    <div className="flex flex-col gap-5">
      {/* Yapışkan hafta şeridi. */}
      <div className="-mx-4 sticky top-24 z-20 border-b border-border bg-bg px-4 py-2">
        <ul className="flex gap-1 overflow-x-auto">
          {gunler.map((gun) => (
            <li key={gun.anahtar}>
              <div
                className={cn(
                  "flex w-14 shrink-0 flex-col items-center gap-1 rounded-md border border-border px-2 py-2",
                  gun.anahtar === bugun ? "bg-primary text-primary-fg" : "bg-surface",
                )}
              >
                <span className="sayisal text-xs">{formatKisa(gun.tarih)}</span>
                <span className="flex h-2 items-center gap-0.5">
                  {Array.from({ length: Math.min(gun.sayi, 3) }).map((_, index) => (
                    <span
                      key={index}
                      aria-hidden
                      className={cn(
                        "size-1 rounded-sm",
                        gun.anahtar === bugun ? "bg-primary-fg" : "bg-accent",
                      )}
                    />
                  ))}
                </span>
                <span className="sr-only">{gun.sayi} sınav</span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h2 className="font-baslik text-xl font-semibold text-text">Yaklaşan sınavlar</h2>
          <Link href="/takvim" className="text-sm text-text-muted hover:underline">
            Tümü →
          </Link>
        </div>

        {/* Tek sütun akış — mobil öncelikli. */}
        <div className="flex flex-col gap-3">
          {yaklasan.map((ilan) => (
            <IlanKarti key={ilan.id} ilan={ilan} simdi={simdi} />
          ))}
        </div>
      </section>
    </div>
  );
}
