import Image from "next/image";
import Link from "next/link";
import { kurumRengi } from "@/lib/kurum-tonu";

// Gerçek logosu yüklenmiş kurumlarda logo gösterilir; yüklenmemişse
// (bkz. ana sayfa notu) kurum tonunda üst şerit + baş harften oluşan
// amblem devreye girer — kartın kalanı --surface/--text üzerinde kalır ki
// kontrast her ton için garanti olsun (§3.5).
export function KurumAmblemi({
  kurum,
}: {
  kurum: { ad: string; slug: string; logoUrl?: string | null };
}) {
  return (
    <Link
      href={`/yayinevi/${kurum.slug}`}
      className="group flex flex-col overflow-hidden rounded-md border border-border bg-surface shadow-sm transition-colors hover:border-border-strong hover:bg-surface-hover"
    >
      {kurum.logoUrl ? (
        <span className="logo-plaka flex h-12 items-center justify-center p-2">
          <Image
            src={kurum.logoUrl}
            alt={kurum.ad}
            width={160}
            height={48}
            className="h-full w-auto object-contain"
          />
        </span>
      ) : (
        <span
          aria-hidden
          style={kurumRengi(kurum.slug)}
          className="kurum-amblem-seridi flex h-12 items-center justify-center"
        >
          <span className="font-baslik text-xl font-bold text-surface">
            {kurum.ad.charAt(0).toLocaleUpperCase("tr-TR")}
          </span>
        </span>
      )}
      <span className="line-clamp-1 px-2 py-2 text-center text-xs text-text">{kurum.ad}</span>
    </Link>
  );
}
