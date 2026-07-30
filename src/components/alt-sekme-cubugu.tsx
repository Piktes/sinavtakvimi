"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, CalendarDays, Search, User } from "lucide-react";
import { cn } from "@/lib/cn";

// §5 V3 / §5.10: alt sekme çubuğu — Takvim · Ara · Bildirimler · Profil.
// Üyelik ve bildirim ekranları §8 Adım 8'de geliyor; sekmeler şimdilik
// takvime ve ana sayfaya bağlı, hazır olmayanlar devre dışı.
const SEKMELER = [
  { href: "/takvim", etiket: "Takvim", ikon: CalendarDays, hazir: true },
  { href: "/ara", etiket: "Ara", ikon: Search, hazir: false },
  { href: "/hesabim/bildirimler", etiket: "Bildirim", ikon: Bell, hazir: false },
  { href: "/hesabim", etiket: "Profil", ikon: User, hazir: false },
];

export function AltSekmeCubugu() {
  const yol = usePathname();

  return (
    <nav
      aria-label="Alt gezinme"
      className="sticky bottom-0 z-30 border-t border-border bg-surface md:hidden"
    >
      <ul className="flex">
        {SEKMELER.map((sekme) => {
          const Ikon = sekme.ikon;
          const aktif = yol === sekme.href;

          if (!sekme.hazir) {
            return (
              <li key={sekme.href} className="flex-1">
                <span
                  aria-disabled
                  title="Yakında"
                  className="flex flex-col items-center gap-1 py-2 text-text-faint"
                >
                  <Ikon size={20} strokeWidth={1.75} aria-hidden />
                  <span className="text-xs">{sekme.etiket}</span>
                </span>
              </li>
            );
          }

          return (
            <li key={sekme.href} className="flex-1">
              <Link
                href={sekme.href}
                aria-current={aktif ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 py-2 transition-colors",
                  aktif ? "text-primary" : "text-text-muted hover:text-text",
                )}
              >
                <Ikon size={20} strokeWidth={1.75} aria-hidden />
                <span className="text-xs">{sekme.etiket}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
