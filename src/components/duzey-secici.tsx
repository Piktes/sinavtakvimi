"use client";

import { Check, ChevronDown } from "lucide-react";
import { useState, useTransition } from "react";
import { duzeySec } from "@/app/tercih-actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export interface DuzeySecenegi {
  id: string;
  ad: string;
}

// §4.2: üst barda her zaman görünür, tek tıkla değiştirilebilir ("11. Sınıf ▾").
export function DuzeySecici({
  duzeyler,
  seciliId,
}: {
  duzeyler: DuzeySecenegi[];
  seciliId: string | null;
}) {
  const [acik, setAcik] = useState(false);
  const [beklemede, baslatGecis] = useTransition();
  const secili = duzeyler.find((d) => d.id === seciliId);

  function sec(id: string | null) {
    setAcik(false);
    baslatGecis(() => {
      void duzeySec(id);
    });
  }

  return (
    <div className="relative">
      <Button
        varyant="ikincil"
        boyut="sm"
        onClick={() => setAcik((o) => !o)}
        disabled={beklemede}
        aria-expanded={acik}
        aria-haspopup="listbox"
      >
        {secili?.ad ?? "Düzey seç"}
        <ChevronDown size={16} strokeWidth={1.75} aria-hidden />
      </Button>

      {acik && (
        <>
          {/* Dışarı tıklayınca kapanır. */}
          <button
            type="button"
            aria-label="Kapat"
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setAcik(false)}
          />
          <ul
            role="listbox"
            aria-label="Düzey seçimi"
            className="absolute right-0 z-20 mt-2 max-h-80 w-56 overflow-y-auto rounded-md border border-border bg-surface p-1 shadow-lg"
          >
            {duzeyler.map((duzey) => {
              const aktif = duzey.id === seciliId;
              return (
                <li key={duzey.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={aktif}
                    onClick={() => sec(duzey.id)}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 rounded-sm px-3 py-2 text-left text-sm text-text transition-colors hover:bg-surface-hover",
                      aktif && "font-medium",
                    )}
                  >
                    {duzey.ad}
                    {aktif && <Check size={16} strokeWidth={1.75} aria-hidden />}
                  </button>
                </li>
              );
            })}
            {seciliId && (
              <li className="border-t border-border pt-1">
                <button
                  type="button"
                  onClick={() => sec(null)}
                  className="w-full rounded-sm px-3 py-2 text-left text-sm text-text-muted transition-colors hover:bg-surface-hover"
                >
                  Seçimi kaldır
                </button>
              </li>
            )}
          </ul>
        </>
      )}
    </div>
  );
}
