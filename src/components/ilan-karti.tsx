import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { kurumRengi } from "@/lib/kurum-tonu";
import { formatTarihAralik, kalanGun } from "@/lib/tarih";
import type { IlanOzet } from "@/lib/veri/ilan";

const ZORLUK_ETIKETI = { KOLAY: "Kolay", ORTA: "Orta", ZOR: "Zor" } as const;
const UYGULAMA_ETIKETI = {
  TURKIYE_GENELI: "Türkiye Geneli",
  KURUMSAL: "Kurumsal",
} as const;

function tarihNesnesi(gun: string): Date {
  return new Date(`${gun}T00:00:00.000Z`);
}

// §3.6: kurum rengi slug'dan üretiliyor; şerit bunu gösteriyor.
export function IlanKarti({ ilan, simdi }: { ilan: IlanOzet; simdi: Date }) {
  const sinav = tarihNesnesi(ilan.sinavTarihi);
  const bitis = ilan.sinavBitisTarihi ? tarihNesnesi(ilan.sinavBitisTarihi) : null;

  return (
    <Card className="relative overflow-hidden transition-colors hover:bg-surface-hover">
      <span
        aria-hidden
        style={kurumRengi(ilan.kurum.slug)}
        className="kurum-zemin absolute inset-y-0 left-0 w-1"
      />
      <div className="flex flex-col gap-2 p-4 pl-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              href={`/ilan/${ilan.slug}`}
              className="font-baslik text-lg font-semibold text-text hover:underline"
            >
              {ilan.baslik}
            </Link>
            <p className="mt-0.5 text-sm text-text-muted">
              <Link href={`/yayinevi/${ilan.kurum.slug}`} className="hover:underline">
                {ilan.kurum.ad}
              </Link>
              {ilan.dagiticiKurum && <> · Dağıtım: {ilan.dagiticiKurum.ad}</>}
            </p>
          </div>
          <span className="sayisal shrink-0 text-sm text-text-muted">
            {kalanGun(sinav, simdi)}
          </span>
        </div>

        <p className="sayisal text-sm text-text">{formatTarihAralik(sinav, bitis)}</p>

        <div className="flex flex-wrap gap-1">
          <Badge varyant="cizgi">{UYGULAMA_ETIKETI[ilan.uygulamaTipi]}</Badge>
          {ilan.zorluk && <Badge varyant="notr">{ZORLUK_ETIKETI[ilan.zorluk]}</Badge>}
          <Badge varyant="notr">{ilan.format.ad}</Badge>
          {ilan.duzeyler.slice(0, 3).map((duzey) => (
            <Badge key={duzey.id} varyant="notr">
              {duzey.ad}
            </Badge>
          ))}
        </div>
      </div>
    </Card>
  );
}

// §4.5: iskelet GERÇEK DÜZENİN şeklinde — genel gri blok değil.
export function IlanKartiIskeleti() {
  return (
    <Card className="p-4 pl-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex w-full flex-col gap-2">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
        </div>
        <Skeleton className="h-4 w-20 shrink-0" />
      </div>
      <Skeleton className="mt-3 h-4 w-40" />
      <div className="mt-3 flex gap-1">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-20" />
      </div>
    </Card>
  );
}
