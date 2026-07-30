import Link from "next/link";
import { kurumRengi } from "@/lib/kurum-tonu";
import { formatKisa, kalanGun } from "@/lib/tarih";
import type { IlanOzet } from "@/lib/veri/ilan";

// §4.5: 7 gün içindeki ilanlar. CSS `transform` ile — `marquee` etiketi veya
// `setInterval` YOK. Üzerine gelince durur. Gösterilecek ilan yoksa tamamen
// gizlenir. `prefers-reduced-motion` altında animasyon global CSS'te duruyor.
export function KayanSerit({ ilanlar, simdi }: { ilanlar: IlanOzet[]; simdi: Date }) {
  if (ilanlar.length === 0) return null;

  // Kesintisiz döngü için liste iki kez basılır; ikinci kopya ekran
  // okuyuculardan gizlenir.
  const kopyalar = [
    { anahtar: "asil", gizli: false },
    { anahtar: "kopya", gizli: true },
  ];

  return (
    <section aria-label="Yaklaşan sınavlar" className="border-b border-border bg-bg-subtle">
      <div className="serit-kapsayici group flex overflow-hidden py-2">
        {kopyalar.map(({ anahtar, gizli }) => (
          <ul
            key={anahtar}
            aria-hidden={gizli || undefined}
            className="serit-parca flex shrink-0 items-center gap-6 px-3"
          >
            {ilanlar.map((ilan) => (
              <li
                key={`${anahtar}-${ilan.id}`}
                className="flex items-center gap-2 whitespace-nowrap"
              >
                <span
                  aria-hidden
                  style={kurumRengi(ilan.kurum.slug)}
                  className="kurum-zemin size-2 rounded-sm"
                />
                <Link href={`/ilan/${ilan.slug}`} className="text-sm text-text hover:underline">
                  {ilan.baslik}
                </Link>
                <span className="sayisal text-xs text-text-muted">
                  {formatKisa(new Date(`${ilan.sinavTarihi}T00:00:00.000Z`))} ·{" "}
                  {kalanGun(new Date(`${ilan.sinavTarihi}T00:00:00.000Z`), simdi)}
                </span>
              </li>
            ))}
          </ul>
        ))}
      </div>
    </section>
  );
}
