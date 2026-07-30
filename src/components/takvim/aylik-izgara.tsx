"use client";

import Link from "next/link";
import { useRef } from "react";
import { cn } from "@/lib/cn";
import { kurumRengi } from "@/lib/kurum-tonu";
import type { IlanOzet } from "@/lib/veri/ilan";

export interface TakvimNotuOzet {
  id: string;
  ad: string;
  baslangic: string;
  bitis: string;
  tip: string;
}

const GUN_BASLIKLARI = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

function gunAnahtarindanParcalar(anahtar: string) {
  const [yil, ay, gun] = anahtar.split("-").map(Number);
  return { yil, ay, gun };
}

function anahtarYap(yil: number, ay: number, gun: number): string {
  return `${yil}-${String(ay).padStart(2, "0")}-${String(gun).padStart(2, "0")}`;
}

// İlan birden çok güne yayılıyorsa (9–12 Ekim) her gününe düşer.
function ilaninGunleri(ilan: IlanOzet): string[] {
  if (!ilan.sinavBitisTarihi) return [ilan.sinavTarihi];

  const gunler: string[] = [];
  const imlec = new Date(`${ilan.sinavTarihi}T00:00:00.000Z`);
  const son = new Date(`${ilan.sinavBitisTarihi}T00:00:00.000Z`);

  while (imlec <= son) {
    gunler.push(imlec.toISOString().slice(0, 10));
    imlec.setUTCDate(imlec.getUTCDate() + 1);
  }
  return gunler;
}

// §4.4: masaüstü varsayılanı. Gün hücrelerinde ilan rozetleri (yayınevi
// tonunda), tatiller gri bantla, ok tuşlarıyla gezinilebilir, Enter açar.
export function AylikIzgara({
  yil,
  ay,
  ilanlar,
  takvimNotlari,
  bugun,
}: {
  yil: number;
  ay: number;
  ilanlar: IlanOzet[];
  takvimNotlari: TakvimNotuOzet[];
  bugun: string;
}) {
  const izgaraRef = useRef<HTMLDivElement>(null);

  const ayinIlkGunu = new Date(Date.UTC(yil, ay - 1, 1));
  const gunSayisi = new Date(Date.UTC(yil, ay, 0)).getUTCDate();
  // Pazartesi = 0 olacak şekilde kaydır (getUTCDay: Pazar = 0).
  const baslangicBoslugu = (ayinIlkGunu.getUTCDay() + 6) % 7;

  const gunlukIlanlar = new Map<string, IlanOzet[]>();
  for (const ilan of ilanlar) {
    for (const gun of ilaninGunleri(ilan)) {
      const liste = gunlukIlanlar.get(gun);
      if (liste) liste.push(ilan);
      else gunlukIlanlar.set(gun, [ilan]);
    }
  }

  function notVarMi(anahtar: string): TakvimNotuOzet | undefined {
    return takvimNotlari.find((not) => anahtar >= not.baslangic && anahtar <= not.bitis);
  }

  // §4.4 / §7: ok tuşlarıyla gezinme, Enter açar.
  function klavye(olay: React.KeyboardEvent<HTMLDivElement>) {
    const adimlar: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -7,
      ArrowDown: 7,
    };
    const adim = adimlar[olay.key];
    if (!adim) return;

    const hedef = olay.target as HTMLElement;
    const suAn = Number(hedef.dataset.gun);
    if (!suAn) return;

    olay.preventDefault();
    const yeni = suAn + adim;
    if (yeni < 1 || yeni > gunSayisi) return;
    izgaraRef.current
      ?.querySelector<HTMLElement>(`[data-gun="${yeni}"]`)
      ?.focus();
  }

  return (
    <div
      ref={izgaraRef}
      onKeyDown={klavye}
      role="grid"
      aria-label="Aylık sınav takvimi"
      className="overflow-hidden rounded-md border border-border bg-surface"
    >
      <div role="row" className="grid grid-cols-7 border-b border-border bg-bg-subtle">
        {GUN_BASLIKLARI.map((gun) => (
          <div
            key={gun}
            role="columnheader"
            className="px-2 py-2 text-center text-xs font-medium text-text-muted"
          >
            {gun}
          </div>
        ))}
      </div>

      <div role="rowgroup" className="grid grid-cols-7">
        {Array.from({ length: baslangicBoslugu }).map((_, index) => (
          <div key={`bosluk-${index}`} role="gridcell" className="min-h-24 border-b border-r border-border bg-bg-subtle" />
        ))}

        {Array.from({ length: gunSayisi }, (_, index) => index + 1).map((gun) => {
          const anahtar = anahtarYap(yil, ay, gun);
          const gununIlanlari = gunlukIlanlar.get(anahtar) ?? [];
          const not = notVarMi(anahtar);
          const bugunMu = anahtar === bugun;

          return (
            <div
              key={anahtar}
              role="gridcell"
              tabIndex={0}
              data-gun={gun}
              aria-label={`${gun} — ${gununIlanlari.length} sınav${not ? `, ${not.ad}` : ""}`}
              className={cn(
                "flex min-h-24 flex-col gap-1 border-b border-r border-border p-1",
                not && "bg-bg-subtle",
              )}
            >
              <span
                className={cn(
                  "sayisal self-end px-1 text-xs",
                  bugunMu
                    ? "rounded-sm bg-accent px-1.5 font-medium text-accent-fg"
                    : "text-text-faint",
                )}
              >
                {gun}
              </span>

              {not && <span className="px-1 text-xs text-text-muted">{not.ad}</span>}

              {gununIlanlari.slice(0, 3).map((ilan) => (
                <Link
                  key={ilan.id}
                  href={`/ilan/${ilan.slug}`}
                  title={`${ilan.baslik} — ${ilan.kurum.ad}${ilan.saat ? ` · ${ilan.saat}` : ""}`}
                  className="flex items-center gap-1 rounded-sm px-1 py-0.5 text-xs text-text transition-colors hover:bg-surface-hover"
                >
                  <span
                    aria-hidden
                    style={kurumRengi(ilan.kurum.slug)}
                    className="kurum-zemin size-1.5 shrink-0 rounded-sm"
                  />
                  <span className="truncate">{ilan.kurum.ad}</span>
                </Link>
              ))}

              {gununIlanlari.length > 3 && (
                <span className="px-1 text-xs text-text-faint">
                  +{gununIlanlari.length - 3} daha
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { gunAnahtarindanParcalar };
