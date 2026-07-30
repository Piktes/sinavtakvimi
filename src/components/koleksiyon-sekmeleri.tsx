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
      <ul className="serit-orta mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 py-1">
        {koleksiyonlar.map((koleksiyon) => {
          const hedef = `/k/${koleksiyon.slug}`;
          return (
            <li key={koleksiyon.id}>
              <Link
                href={hedef}
                data-etiket={koleksiyon.ad}
                aria-current={yol === hedef ? "page" : undefined}
                className={cn(
                  "gezinme-bagi inline-flex h-8 items-center rounded-sm px-3 text-sm whitespace-nowrap text-text-muted hover:bg-surface-hover hover:text-text",
                  // Seçili sekme belirgin kalsın: yalnızca hafif zemin değil,
                  // birincil renkte dolgu (§3.5 anlamsal token).
                  yol === hedef && "bg-primary font-medium text-primary-fg hover:bg-primary-hover hover:text-primary-fg",
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
