"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import type { NavOgesi } from "@/lib/yonetim-nav";

export function YanMenu({ ogeler }: { ogeler: NavOgesi[] }) {
  const yol = usePathname();

  return (
    <nav aria-label="Yönetim menüsü" className="flex flex-col gap-1">
      {ogeler.map((oge) => {
        if (!oge.hazir) {
          return (
            <span
              key={oge.href}
              aria-disabled
              title={oge.not ? `${oge.not}'de gelecek` : "Yakında"}
              className="flex items-center justify-between rounded-sm px-3 py-2 text-sm text-text-faint"
            >
              {oge.etiket}
              {oge.not && <span className="text-xs">{oge.not}</span>}
            </span>
          );
        }

        const aktif = oge.href === "/yonetim" ? yol === oge.href : yol.startsWith(oge.href);

        return (
          <Link
            key={oge.href}
            href={oge.href}
            aria-current={aktif ? "page" : undefined}
            className={cn(
              "rounded-sm px-3 py-2 text-sm transition-colors",
              aktif ? "bg-bg-subtle font-medium text-text" : "text-text-muted hover:bg-surface-hover",
            )}
          >
            {oge.etiket}
          </Link>
        );
      })}
    </nav>
  );
}
