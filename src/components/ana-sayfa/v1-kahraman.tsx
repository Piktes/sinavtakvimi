import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { kurumRengi } from "@/lib/kurum-tonu";
import { formatTarihAralik, kalanGun, kalanGunSayisi } from "@/lib/tarih";
import type { IlanOzet } from "@/lib/veri/ilan";

// Kahraman bölümünde gerçek fotoğraf/logo yok — dekoratif köşe ikonu bunun
// yerine geçiyor, tamamen ikon/vektör tabanlı (§3.7: yalnızca Lucide).
function KosekIkonu() {
  return (
    <GraduationCap
      aria-hidden
      strokeWidth={1}
      className="pointer-events-none absolute -right-6 -bottom-10 z-0 size-48 text-text opacity-10 select-none sm:size-56"
    />
  );
}

// §5 V1 "Ajanda" kahraman bölümü: ay ızgarasının üstünde, en yakın sınava
// kalan günü flip-clock görünümlü rakamlarla gösterir. Sabit metin —
// kabul kriteri #6 gereği canlı sayaç/aria-live yok, yalnızca görünüm.
export function AnaSayfaV1Kahraman({
  enYakin,
  simdi,
}: {
  enYakin: IlanOzet | undefined;
  simdi: Date;
}) {
  if (!enYakin) {
    return (
      <div className="kahraman-belir kahraman-zemin relative -mx-4 flex flex-col gap-2 overflow-hidden px-4 py-7 sm:px-6">
        <KosekIkonu />
        <h1 className="font-baslik text-3xl leading-none font-bold text-text">
          Sınav takvimini kaçırma
        </h1>
        <p className="text-sm text-text-muted">
          Düzeyini seç, yayınevlerinin deneme sınavlarını tek yerden takip et.
        </p>
      </div>
    );
  }

  const sinav = new Date(`${enYakin.sinavTarihi}T00:00:00.000Z`);
  const bitis = enYakin.sinavBitisTarihi ? new Date(`${enYakin.sinavBitisTarihi}T00:00:00.000Z`) : null;
  const gun = Math.max(kalanGunSayisi(sinav, simdi), 0);
  const rakamlar = String(gun).split("");

  return (
    <div className="kahraman-belir kahraman-zemin relative -mx-4 flex flex-col gap-5 overflow-hidden px-4 py-7 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <KosekIkonu />
      <div className="relative flex flex-col gap-2">
        <Badge varyant="vurgu" className="w-fit">
          En yakın sınav
        </Badge>
        <Link href={`/ilan/${enYakin.slug}`}>
          <h1 className="font-baslik text-3xl leading-none font-bold text-text hover:underline">
            {enYakin.baslik}
          </h1>
        </Link>
        <p className="text-sm text-text-muted">
          <span
            aria-hidden
            style={kurumRengi(enYakin.kurum.slug)}
            className="kurum-zemin mr-1 inline-block size-2 rounded-sm align-middle"
          />
          {enYakin.kurum.ad} · <span className="sayisal">{formatTarihAralik(sinav, bitis)}</span>
        </p>
      </div>

      {gun <= 0 ? (
        <p className="sayisal relative text-2xl font-bold text-text">{kalanGun(sinav, simdi)}</p>
      ) : (
        <div className="relative flex flex-col items-center gap-1">
          <div className="flex gap-1">
            {rakamlar.map((rakam, index) => (
              <span
                key={index}
                className="flip-rakam sayisal flex h-14 w-11 items-center justify-center rounded-md border border-border bg-surface text-3xl font-bold text-text shadow-md"
              >
                {rakam}
              </span>
            ))}
          </div>
          <span className="text-xs text-text-muted">gün kaldı</span>
        </div>
      )}
    </div>
  );
}
