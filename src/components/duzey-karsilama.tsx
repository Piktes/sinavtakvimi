"use client";

import { ListChecks } from "lucide-react";
import { useTransition } from "react";
import { duzeySec } from "@/app/tercih-actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { DuzeySecenegi } from "@/components/duzey-secici";

// §4.2: ilk ziyarette, giriş gerektirmeden, TEK ADIMLIK seçim.
// "Bu tek karar, ürünün kullanılabilir olup olmamasını belirler. Onsuz her
// kullanıcı 1000 kayıtlık bir duvara bakar."
//
// "Sonra seçerim" engelleyici değil — diyen kullanıcı her şeyi görür.
export function DuzeyKarsilama({ duzeyler }: { duzeyler: DuzeySecenegi[] }) {
  const [beklemede, baslatGecis] = useTransition();

  function sec(id: string | null) {
    baslatGecis(() => {
      void duzeySec(id);
    });
  }

  return (
    <Card className="mx-auto max-w-2xl p-5">
      <div className="mx-auto flex size-10 items-center justify-center rounded-md bg-accent">
        <ListChecks size={20} strokeWidth={1.75} aria-hidden className="text-accent-fg" />
      </div>
      <h2 className="mt-3 text-center font-baslik text-xl font-semibold text-text">
        Hangi düzeydesin?
      </h2>
      <p className="mt-1 text-center text-sm text-text-muted">
        Seçtiğin düzey tüm sayfalarda varsayılan filtren olur. İstediğin zaman değiştirebilirsin.
      </p>

      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {duzeyler.map((duzey) => (
          <Button
            key={duzey.id}
            varyant="ikincil"
            boyut="sm"
            disabled={beklemede}
            onClick={() => sec(duzey.id)}
          >
            {duzey.ad}
          </Button>
        ))}
      </div>

      <div className="mt-4 flex justify-center">
        <Button varyant="bag" boyut="sm" disabled={beklemede} onClick={() => sec(null)}>
          Sonra seçerim →
        </Button>
      </div>
    </Card>
  );
}
