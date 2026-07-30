import Image from "next/image";
import Link from "next/link";
import { Building2, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/cn";
import { kurumRengi } from "@/lib/kurum-tonu";
import { formatTarihAralik, kalanGun, kalanGunSayisi } from "@/lib/tarih";
import type { IlanOzet } from "@/lib/veri/ilan";

const ZORLUK_ETIKETI = { KOLAY: "Kolay", ORTA: "Orta", ZOR: "Zor" } as const;
const UYGULAMA_ETIKETI = {
  TURKIYE_GENELI: "Türkiye Geneli",
  KURUMSAL: "Kurumsal",
} as const;

function tarihNesnesi(gun: string): Date {
  return new Date(`${gun}T00:00:00.000Z`);
}

// §3.6: kurum rengi slug'dan üretiliyor ama başlık şeridi HER KARTTA nötr —
// 45 farklı ton yan yana kalabalık/rastgele durduğu için (kullanıcı geri
// bildirimi) yalnızca küçük bir nokta olarak kalıyor. Uygulama tipine göre
// ikon (Türkiye geneli → küre, kurumsal → bina) markayı somutlaştırıyor.
export function IlanKarti({ ilan, simdi }: { ilan: IlanOzet; simdi: Date }) {
  const sinav = tarihNesnesi(ilan.sinavTarihi);
  const bitis = ilan.sinavBitisTarihi ? tarihNesnesi(ilan.sinavBitisTarihi) : null;
  const UygulamaIkonu = ilan.uygulamaTipi === "KURUMSAL" ? Building2 : Globe;

  // §4.5 uzantısı: "Bugün"/"Yarın" diğer kartlardan görsel olarak ayrılsın —
  // öğrenci en acil sınavı taramadan yakalasın.
  const gun = kalanGunSayisi(sinav, simdi);
  const aciliyet = gun <= 0 ? "bugun" : gun === 1 ? "yarin" : null;

  return (
    <Card
      className={cn(
        "overflow-hidden transition-colors hover:bg-surface-hover",
        aciliyet === "bugun" && "border-danger",
        aciliyet === "yarin" && "border-warning",
      )}
    >
      <div className="flex items-center gap-2 bg-bg-subtle px-4 py-2">
        {ilan.kurum.logoUrl ? (
          <span className="logo-plaka flex h-5 shrink-0 items-center rounded-sm px-1">
            <Image
              src={ilan.kurum.logoUrl}
              alt=""
              aria-hidden
              width={64}
              height={20}
              className="h-4 w-auto object-contain"
            />
          </span>
        ) : (
          <span
            aria-hidden
            style={kurumRengi(ilan.kurum.slug)}
            className="kurum-zemin size-2 shrink-0 rounded-sm"
          />
        )}
        <UygulamaIkonu
          size={16}
          strokeWidth={1.75}
          aria-hidden
          className="shrink-0 text-text-muted"
        />
        <Link
          href={`/yayinevi/${ilan.kurum.slug}`}
          className="truncate text-xs font-semibold tracking-wide text-text-muted uppercase hover:underline"
        >
          {ilan.kurum.ad}
        </Link>
        <Badge
          varyant={aciliyet === "bugun" ? "tehlike" : aciliyet === "yarin" ? "uyari" : "notr"}
          className={cn("sayisal ml-auto shrink-0", aciliyet && "aciliyet-nabiz")}
        >
          {kalanGun(sinav, simdi)}
        </Badge>
      </div>

      <div className="flex flex-col gap-3 p-4">
        <div>
          <Link
            href={`/ilan/${ilan.slug}`}
            className="font-baslik text-lg font-semibold text-text hover:underline"
          >
            {ilan.baslik}
          </Link>
          {ilan.dagiticiKurum && (
            <p className="mt-0.5 text-sm text-text-muted">Dağıtım: {ilan.dagiticiKurum.ad}</p>
          )}
        </div>

        <p className="sayisal text-sm text-text">{formatTarihAralik(sinav, bitis)}</p>

        <div className="flex flex-wrap gap-2">
          <Badge varyant="cizgi">{UYGULAMA_ETIKETI[ilan.uygulamaTipi]}</Badge>
          {ilan.il && <Badge varyant="notr">{ilan.il}</Badge>}
          {ilan.zorluk && <Badge varyant="notr">{ZORLUK_ETIKETI[ilan.zorluk]}</Badge>}
          <Badge varyant="notr">{ilan.format.ad}</Badge>
          {ilan.duzeyler.slice(0, 2).map((duzey) => (
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
