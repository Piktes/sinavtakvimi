"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

export interface KoleksiyonSekmesi {
  id: string;
  ad: string;
  slug: string;
}

// §5.3: sekmeler Koleksiyon kayıtlarından gelir — sırası, adı, hangisinin
// görüneceği admin panelden. Mobilde yatay kaydırmalı.
export function KoleksiyonSekmeleri({ koleksiyonlar }: { koleksiyonlar: KoleksiyonSekmesi[] }) {
  const yol = usePathname();

  if (koleksiyonlar.length === 0) return null;

  return (
    <nav aria-label="Koleksiyonlar" className="border-t border-border">
      <ul className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 py-1">
        <li>
          <Link
            href="/takvim"
            className={cn(
              "inline-flex h-8 items-center rounded-sm px-3 text-sm whitespace-nowrap text-text-muted transition-colors hover:bg-surface-hover",
              yol === "/takvim" && "bg-bg-subtle font-medium text-text",
            )}
          >
            Tümü
          </Link>
        </li>
        {koleksiyonlar.map((koleksiyon) => {
          const hedef = `/k/${koleksiyon.slug}`;
          return (
            <li key={koleksiyon.id}>
              <Link
                href={hedef}
                className={cn(
                  "inline-flex h-8 items-center rounded-sm px-3 text-sm whitespace-nowrap text-text-muted transition-colors hover:bg-surface-hover",
                  yol === hedef && "bg-bg-subtle font-medium text-text",
                )}
              >
                {koleksiyon.ad}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
