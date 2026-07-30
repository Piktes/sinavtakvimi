import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

// §3.7: uygulamada TEK EmptyState.
// §4.5: boş durumlar TASARLANMIŞ olmalı — "Bu filtrelerde ilan yok" + öneri
// + temizle butonu. `eylem` slotu bu yüzden var.
export function EmptyState({
  ikon: Ikon,
  baslik,
  aciklama,
  eylem,
  className,
}: {
  ikon?: LucideIcon;
  baslik: string;
  aciklama?: React.ReactNode;
  eylem?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-md border border-dashed border-border px-5 py-8 text-center",
        className,
      )}
    >
      {Ikon && <Ikon size={24} strokeWidth={1.75} className="text-text-faint" aria-hidden />}
      <div className="flex flex-col gap-1">
        <p className="text-base font-medium text-text">{baslik}</p>
        {aciklama && <p className="text-sm text-text-muted">{aciklama}</p>}
      </div>
      {eylem}
    </div>
  );
}
