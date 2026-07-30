import Image from "next/image";
import Link from "next/link";
import { Flame } from "lucide-react";
import { IlanKarti } from "@/components/ilan-karti";
import { ScrollBelir } from "@/components/scroll-belir";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import { kurumRengi } from "@/lib/kurum-tonu";
import { formatKisa, gunAnahtari, kalanGun } from "@/lib/tarih";
import type { IlanOzet } from "@/lib/veri/ilan";

// §5 V3 "Akış": uygulama gibi, mobil öncelikli tek sütun akış.
// İmza: uygulama başlığı + yapışkan hafta şeridi + kaydırınca ÖLÇEKLENEN
// kartlar. Alt sekme çubuğu düzen bileşeninde.
//
// V1/V2'den bilinçli farklar (§5): geri sayım flip-clock kartı ya da magazin
// manşeti değil, uygulama üst bandındaki tek satır "durum" özeti; logolar
// duvar değil, yatay kaydırmalı sıra; hareket ölçeklenme.
export function AnaSayfaV3({
  yaklasan,
  kurumlar,
  simdi,
}: {
  yaklasan: IlanOzet[];
  kurumlar: { id: string; ad: string; slug: string; logoUrl: string | null }[];
  simdi: Date;
}) {
  const bugun = gunAnahtari(simdi);
  const enYakin = yaklasan[0];

  // §5 V3 "hafta şeridi" — adı üstünde BİR HAFTA (7 gün). Önceden 14 güne
  // uzuyordu, iki hafta göstermek şeridi gereksiz uzatıp anlamını bozuyordu.
  const gunler = Array.from({ length: 7 }, (_, index) => {
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
      {/* §5 V3 kahraman: uygulama üst bandı — tek satır durum özeti. */}
      {enYakin && (
        <div className="akis-zemin -mx-4 flex flex-col gap-2 px-4 py-5 sm:px-6">
          <div className="flex items-center gap-2">
            <Flame size={16} strokeWidth={1.75} aria-hidden className="text-accent" />
            <span className="text-xs font-medium tracking-wide text-text-muted uppercase">
              Sıradaki
            </span>
            <Badge varyant="vurgu" className="sayisal ml-auto">
              {kalanGun(new Date(`${enYakin.sinavTarihi}T00:00:00.000Z`), simdi)}
            </Badge>
          </div>

          <Link href={`/ilan/${enYakin.slug}`}>
            <h1 className="font-baslik text-2xl leading-none font-semibold text-text hover:underline">
              {enYakin.baslik}
            </h1>
          </Link>

          <p className="text-sm text-text-muted">
            <span
              aria-hidden
              style={kurumRengi(enYakin.kurum.slug)}
              className="kurum-zemin mr-1 inline-block size-2 rounded-sm align-middle"
            />
            {enYakin.kurum.ad} · <span className="sayisal">{yaklasan.length} yaklaşan sınav</span>
          </p>
        </div>
      )}

      {/* Yapışkan hafta şeridi. */}
      <div className="yapiskan-ust -mx-4 z-20 border-b border-border bg-bg px-4 py-2">
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

      {/* §5 V3: logolar duvar değil — kendiliğinden kayan yatay sıra.
       * Kesintisiz döngü için liste iki kez basılır; ikinci kopya ekran
       * okuyuculardan gizli. */}
      <section className="flex flex-col gap-2">
        <h2 className="font-baslik text-lg font-semibold text-text">Yayınevleri</h2>
        <div className="logo-akis-kapsayici -mx-4 flex overflow-hidden px-4">
          {[0, 1].map((kopya) => (
            <ul key={kopya} className="logo-akis flex shrink-0 gap-2 pr-2" aria-hidden={kopya === 1}>
              {kurumlar.map((kurum) => (
                <li key={kurum.id} className="shrink-0">
                  <Link
                    href={`/yayinevi/${kurum.slug}`}
                    className="flex w-24 flex-col items-center gap-1 rounded-md border border-border bg-surface p-2 transition-colors hover:bg-surface-hover"
                  >
                    {kurum.logoUrl ? (
                      <span className="logo-plaka flex h-8 w-full items-center justify-center rounded-sm px-1">
                        <Image
                          src={kurum.logoUrl}
                          alt=""
                          aria-hidden
                          width={80}
                          height={32}
                          className="max-h-full w-auto object-contain"
                        />
                      </span>
                    ) : (
                      <span
                        aria-hidden
                        style={kurumRengi(kurum.slug)}
                        className="kurum-amblem-seridi flex size-8 items-center justify-center rounded-md"
                      >
                        <span className="font-baslik text-sm font-bold text-surface">
                          {kurum.ad.charAt(0).toLocaleUpperCase("tr-TR")}
                        </span>
                      </span>
                    )}
                    <span className="line-clamp-1 text-center text-xs text-text">{kurum.ad}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h2 className="font-baslik text-xl font-semibold text-text">Yaklaşan sınavlar</h2>
          <Link href="/takvim" className="text-sm text-text-muted hover:underline">
            Tümü →
          </Link>
        </div>

        {/* Tek sütun akış — mobil öncelikli. §5 V3 imzası: kartlar kaydırınca
         * hafifçe ölçeklenir. */}
        <div className="flex flex-col gap-3">
          {yaklasan.map((ilan) => (
            <ScrollBelir key={ilan.id} hareket="olcek">
              <IlanKarti ilan={ilan} simdi={simdi} />
            </ScrollBelir>
          ))}
        </div>
      </section>
    </div>
  );
}
