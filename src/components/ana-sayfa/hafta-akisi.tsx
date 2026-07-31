"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

export interface HaftaGunu {
  anahtar: string;
  etiket: string;
  buGun: boolean;
  sayi: number;
}

export interface HaftaKarti {
  anahtar: string;
  eleman: React.ReactNode;
}

// §5 V3 hafta şeridi: yalnızca yoğunluk göstermekle kalmaz, güne tıklanınca
// alttaki liste o güne filtrelenir — aynı güne tekrar tıklamak filtreyi
// kaldırır. Kartlar SUNUCUDA render edilip buraya hazır eleman olarak
// geliyor (IlanKarti/ScrollBelir server component; istemciye yalnızca
// filtreleme mantığı ve serileştirilebilir gün özeti geçiyor).
export function HaftaAkisi({ gunler, kartlar }: { gunler: HaftaGunu[]; kartlar: HaftaKarti[] }) {
  const [secili, setSecili] = useState<string | null>(null);
  const seciliGun = gunler.find((gun) => gun.anahtar === secili);
  const gorunenler = secili ? kartlar.filter((kart) => kart.anahtar === secili) : kartlar;

  return (
    <>
      <div className="yapiskan-ust -mx-4 z-20 border-b border-border bg-bg px-4 py-2">
        <ul className="flex gap-1 overflow-x-auto overscroll-x-contain">
          {gunler.map((gun) => {
            const gunSecili = gun.anahtar === secili;
            return (
              <li key={gun.anahtar}>
                <button
                  type="button"
                  aria-pressed={gunSecili}
                  onClick={() => setSecili((mevcut) => (mevcut === gun.anahtar ? null : gun.anahtar))}
                  className={cn(
                    "flex w-14 shrink-0 flex-col items-center gap-1 rounded-md border px-2 py-2 transition-colors",
                    gunSecili
                      ? "border-primary bg-primary text-primary-fg"
                      : gun.buGun
                        ? "border-primary/60 bg-surface"
                        : "border-border bg-surface",
                  )}
                >
                  <span className="sayisal text-xs">{gun.etiket}</span>
                  <span className="flex h-2 items-center gap-0.5">
                    {Array.from({ length: Math.min(gun.sayi, 3) }).map((_, index) => (
                      <span
                        key={index}
                        aria-hidden
                        className={cn("size-1 rounded-sm", gunSecili ? "bg-primary-fg" : "bg-accent")}
                      />
                    ))}
                  </span>
                  <span className="sr-only">
                    {gun.sayi} sınav{gunSecili ? ", seçili" : ""}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {seciliGun && (
        <p className="-mt-2 flex items-center gap-2 text-sm text-text-muted">
          <span>
            {seciliGun.etiket} · {gorunenler.length} sınav
          </span>
          <button type="button" onClick={() => setSecili(null)} className="text-primary hover:underline">
            Tümünü göster
          </button>
        </p>
      )}

      <div className="flex flex-col gap-3">
        {gorunenler.length === 0 ? (
          <p className="text-sm text-text-muted">Bu günde sınav yok.</p>
        ) : (
          gorunenler.map((kart, index) => <div key={`${kart.anahtar}-${index}`}>{kart.eleman}</div>)
        )}
      </div>
    </>
  );
}
