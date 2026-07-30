import Link from "next/link";
import { CalendarDays, UserRound } from "lucide-react";
import { DuzeySecici, type DuzeySecenegi } from "@/components/duzey-secici";
import { TemaDugmesi } from "@/components/tema-dugmesi";
import { KoleksiyonSekmeleri, type KoleksiyonSekmesi } from "@/components/koleksiyon-sekmeleri";
import { butonVaryantlari } from "@/components/ui/button";
import { uyeVarsa } from "@/lib/rbac";

// §5.3 gezinme: logo · ara · düzey seçici · tema · altında koleksiyon sekmeleri.
export async function UstBar({
  koleksiyonlar,
  duzeyler,
  seciliDuzeyId,
  tema,
}: {
  koleksiyonlar: KoleksiyonSekmesi[];
  duzeyler: DuzeySecenegi[];
  seciliDuzeyId: string | null;
  tema: "acik" | "koyu" | null;
}) {
  const uye = await uyeVarsa();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-baslik font-bold text-text">
          <CalendarDays size={20} strokeWidth={1.75} aria-hidden />
          <span>Sınav İlan</span>
        </Link>

        <div className="ml-auto flex items-center gap-2">
          <DuzeySecici duzeyler={duzeyler} seciliId={seciliDuzeyId} />
          <TemaDugmesi tema={tema} />

          {uye ? (
            <Link
              href="/hesabim"
              title={uye.takmaAd}
              className={butonVaryantlari({ varyant: "hayalet", boyut: "sm" })}
            >
              <UserRound size={16} strokeWidth={1.75} aria-hidden />
              <span className="hidden sm:inline">{uye.takmaAd}</span>
              <span className="sr-only sm:hidden">Hesabım</span>
            </Link>
          ) : (
            <Link href="/giris" className={butonVaryantlari({ varyant: "ikincil", boyut: "sm" })}>
              Giriş
            </Link>
          )}
        </div>
      </div>

      <KoleksiyonSekmeleri koleksiyonlar={koleksiyonlar} />
    </header>
  );
}
