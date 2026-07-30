import Image from "next/image";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { IlanKarti } from "@/components/ilan-karti";
import { KurumAmblemi } from "@/components/kurum-amblemi";
import { ScrollBelir } from "@/components/scroll-belir";
import { Badge } from "@/components/ui/badge";
import { kurumRengi } from "@/lib/kurum-tonu";
import { formatTarihAralik, kalanGun, kalanGunSayisi } from "@/lib/tarih";
import type { IlanOzet } from "@/lib/veri/ilan";

// §5 V2 "Vitrin": yayınevi markalarının öne çıktığı magazin düzeni.
// İmza: en üstte ekranı kesen, KALEMLERİ KAYAN kalın uyarı bandı; altında
// magazin künyesi (kapak manşeti) ve büyük yayınevi logo duvarı.
//
// V1'den bilinçli farklar (§5 "fark yalnızca token ve DÜZEN"):
//   · geri sayım flip-clock kartı DEĞİL, künye üstünde tek satır manşet
//   · kahraman zemin yumuşak gradyan DEĞİL, keskin editoryal kural çizgisi
//   · kaydırma hareketi yukarı DEĞİL, sayfa çevirir gibi yandan
export function AnaSayfaV2({
  yaklasan,
  kurumlar,
  simdi,
}: {
  yaklasan: IlanOzet[];
  kurumlar: { id: string; ad: string; slug: string; logoUrl: string | null }[];
  simdi: Date;
}) {
  const oneCikan = yaklasan[0];
  const digerleri = yaklasan.slice(1, 7);
  // Bant kalemleri: 7 gün içindekiler. Kesintisiz kayma için liste iki kez
  // basılır (kayan şeritle aynı teknik).
  const bantKalemleri = yaklasan.filter((ilan) => kalanGunSayisi(dateOf(ilan.sinavTarihi), simdi) <= 7);

  return (
    <div className="flex flex-col gap-6">
      {/* §5 V2 imzası: ekranı kesen kalın uyarı bandı, kalemleri kayar. */}
      {bantKalemleri.length > 0 && (
        <div className="bant-kapsayici -mx-4 flex items-center gap-3 overflow-hidden bg-accent py-3 text-accent-fg">
          <AlertTriangle
            size={20}
            strokeWidth={1.75}
            aria-hidden
            className="ml-4 shrink-0"
          />
          <div className="flex min-w-0 flex-1 overflow-hidden">
            {[0, 1].map((kopya) => (
              <ul key={kopya} className="bant-parca flex shrink-0 gap-6 pr-6" aria-hidden={kopya === 1}>
                {bantKalemleri.map((ilan) => (
                  <li key={ilan.id} className="shrink-0 text-sm font-semibold whitespace-nowrap">
                    <Link href={`/ilan/${ilan.slug}`} className="underline underline-offset-2">
                      {ilan.baslik}
                    </Link>{" "}
                    <span className="sayisal">{kalanGun(dateOf(ilan.sinavTarihi), simdi)}</span>
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>
      )}

      {/* §5 V2 kahraman: magazin künyesi — logo solda büyük, manşet sağda. */}
      {oneCikan && (
        <div className="kunye-zemin -mx-4 flex flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:px-6">
          {oneCikan.kurum.logoUrl ? (
            <span className="logo-plaka flex h-14 shrink-0 items-center rounded-md px-3 sm:h-20">
              <Image
                src={oneCikan.kurum.logoUrl}
                alt={oneCikan.kurum.ad}
                width={160}
                height={80}
                className="max-h-full w-auto object-contain"
              />
            </span>
          ) : (
            <span
              aria-hidden
              style={kurumRengi(oneCikan.kurum.slug)}
              className="kurum-amblem-seridi flex size-14 shrink-0 items-center justify-center rounded-md sm:size-20"
            >
              <span className="font-baslik text-2xl font-bold text-surface">
                {oneCikan.kurum.ad.charAt(0).toLocaleUpperCase("tr-TR")}
              </span>
            </span>
          )}

          <div className="flex min-w-0 flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge varyant="vurgu">Kapak</Badge>
              <Link
                href={`/yayinevi/${oneCikan.kurum.slug}`}
                className="text-sm text-text-muted hover:underline"
              >
                {oneCikan.kurum.ad}
              </Link>
            </div>

            <Link href={`/ilan/${oneCikan.slug}`}>
              <h1 className="font-baslik text-3xl leading-none text-text hover:underline">
                {oneCikan.baslik}
              </h1>
            </Link>

            <p className="sayisal text-lg text-text">
              {formatTarihAralik(
                dateOf(oneCikan.sinavTarihi),
                oneCikan.sinavBitisTarihi ? dateOf(oneCikan.sinavBitisTarihi) : null,
              )}{" "}
              · {kalanGun(dateOf(oneCikan.sinavTarihi), simdi)}
            </p>
          </div>
        </div>
      )}

      {oneCikan && (
        <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          {/* Öne çıkan ilanın kendisi ortak kartla — künye zaten manşeti verdi. */}
          <IlanKarti ilan={oneCikan} simdi={simdi} />

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
      <ScrollBelir as="section" hareket="kayar" className="flex flex-col gap-3">
        <h2 className="font-baslik text-xl text-text">Yayınevleri</h2>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {kurumlar.map((kurum) => (
            <li key={kurum.id}>
              <KurumAmblemi kurum={kurum} />
            </li>
          ))}
        </ul>
      </ScrollBelir>

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h2 className="font-baslik text-xl text-text">Bu hafta</h2>
          <Link href="/takvim" className="text-sm text-text-muted hover:underline">
            Takvimin tamamı →
          </Link>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {yaklasan.slice(0, 4).map((ilan, index) => (
            <ScrollBelir key={ilan.id} hareket="kayar" gecikme={(index % 2) * 80}>
              <IlanKarti ilan={ilan} simdi={simdi} />
            </ScrollBelir>
          ))}
        </div>
      </section>
    </div>
  );
}

function dateOf(gun: string): Date {
  return new Date(`${gun}T00:00:00.000Z`);
}
