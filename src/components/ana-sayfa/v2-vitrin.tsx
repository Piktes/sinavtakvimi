import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { IlanKarti } from "@/components/ilan-karti";
import { Badge } from "@/components/ui/badge";
import { Card, CardGovde } from "@/components/ui/card";
import { kurumRengi } from "@/lib/kurum-tonu";
import { formatTarihAralik, kalanGun } from "@/lib/tarih";
import type { IlanOzet } from "@/lib/veri/ilan";

// §5 V2 "Vitrin": yayınevi markalarının öne çıktığı magazin düzeni.
// İmza: en üstte ekranı kesen kalın uyarı bandı, altında büyük yayınevi
// logo duvarı. Düzen: öne çıkan ilan büyük kart, yanında yaklaşanlar listesi.
export function AnaSayfaV2({
  yaklasan,
  kurumlar,
  simdi,
}: {
  yaklasan: IlanOzet[];
  kurumlar: { id: string; ad: string; slug: string }[];
  simdi: Date;
}) {
  const oneCikan = yaklasan[0];
  const digerleri = yaklasan.slice(1, 7);

  return (
    <div className="flex flex-col gap-6">
      {/* §5 V2 imzası: ekranı kesen kalın uyarı bandı. */}
      {oneCikan && (
        <div className="-mx-4 flex items-center gap-3 bg-accent px-4 py-3 text-accent-fg">
          <AlertTriangle size={20} strokeWidth={1.75} aria-hidden className="shrink-0" />
          <p className="text-sm font-semibold">
            <span className="sayisal">{kalanGun(dateOf(oneCikan.sinavTarihi), simdi)}</span> ·{" "}
            <Link href={`/ilan/${oneCikan.slug}`} className="underline underline-offset-2">
              {oneCikan.baslik}
            </Link>
          </p>
        </div>
      )}

      {oneCikan && (
        <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          {/* Öne çıkan ilan büyük kart. */}
          <Card className="relative overflow-hidden">
            <span
              aria-hidden
              style={kurumRengi(oneCikan.kurum.slug)}
              className="kurum-zemin absolute inset-x-0 top-0 h-2"
            />
            <CardGovde className="flex flex-col gap-3 p-5 pt-6">
              <div className="flex items-center gap-2">
                <span
                  aria-hidden
                  style={kurumRengi(oneCikan.kurum.slug)}
                  className="kurum-zemin size-3 rounded-sm"
                />
                <Link
                  href={`/yayinevi/${oneCikan.kurum.slug}`}
                  className="text-sm text-text-muted hover:underline"
                >
                  {oneCikan.kurum.ad}
                </Link>
              </div>

              <Link href={`/ilan/${oneCikan.slug}`}>
                <h2 className="font-baslik text-2xl text-text hover:underline">
                  {oneCikan.baslik}
                </h2>
              </Link>

              <p className="sayisal text-lg text-text">
                {formatTarihAralik(
                  dateOf(oneCikan.sinavTarihi),
                  oneCikan.sinavBitisTarihi ? dateOf(oneCikan.sinavBitisTarihi) : null,
                )}
              </p>

              <div className="flex flex-wrap gap-1">
                <Badge varyant="vurgu">{kalanGun(dateOf(oneCikan.sinavTarihi), simdi)}</Badge>
                <Badge varyant="cizgi">{oneCikan.format.ad}</Badge>
                {oneCikan.duzeyler.slice(0, 3).map((duzey) => (
                  <Badge key={duzey.id} varyant="notr">
                    {duzey.ad}
                  </Badge>
                ))}
              </div>
            </CardGovde>
          </Card>

          <div className="flex flex-col gap-2">
            <h3 className="font-baslik text-lg text-text">Yaklaşanlar</h3>
            <ul className="flex flex-col divide-y divide-border rounded-md border border-border bg-surface">
              {digerleri.map((ilan) => (
                <li key={ilan.id}>
                  <Link
                    href={`/ilan/${ilan.slug}`}
                    className="flex items-center gap-2 p-3 transition-colors hover:bg-surface-hover"
                  >
                    <span
                      aria-hidden
                      style={kurumRengi(ilan.kurum.slug)}
                      className="kurum-zemin size-2 shrink-0 rounded-sm"
                    />
                    <span className="min-w-0 flex-1 truncate text-sm text-text">{ilan.baslik}</span>
                    <span className="sayisal shrink-0 text-xs text-text-muted">
                      {kalanGun(dateOf(ilan.sinavTarihi), simdi)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* §5 V2: büyük yayınevi logo duvarı — markalar baskın. */}
      <section className="flex flex-col gap-3">
        <h2 className="font-baslik text-xl text-text">Yayınevleri</h2>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {kurumlar.map((kurum) => (
            <li key={kurum.id}>
              <Link
                href={`/yayinevi/${kurum.slug}`}
                className="flex h-20 flex-col items-center justify-center gap-2 rounded-md border border-border bg-surface p-2 text-center transition-colors hover:bg-surface-hover"
              >
                <span
                  aria-hidden
                  style={kurumRengi(kurum.slug)}
                  className="kurum-zemin size-6 rounded-md"
                />
                <span className="line-clamp-1 text-xs text-text">{kurum.ad}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h2 className="font-baslik text-xl text-text">Bu hafta</h2>
          <Link href="/takvim" className="text-sm text-text-muted hover:underline">
            Takvimin tamamı →
          </Link>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {yaklasan.slice(0, 4).map((ilan) => (
            <IlanKarti key={ilan.id} ilan={ilan} simdi={simdi} />
          ))}
        </div>
      </section>
    </div>
  );
}

function dateOf(gun: string): Date {
  return new Date(`${gun}T00:00:00.000Z`);
}
