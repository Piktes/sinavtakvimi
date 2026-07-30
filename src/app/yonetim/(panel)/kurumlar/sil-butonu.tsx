"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { kurumSil } from "./actions";

export function KurumSilButonu({
  id,
  ad,
  ilanSayisi,
}: {
  id: string;
  ad: string;
  ilanSayisi: number;
}) {
  const [hata, setHata] = useState<string | null>(null);
  const [beklemede, baslatGecis] = useTransition();

  return (
    <div className="flex shrink-0 flex-col items-end">
      <Button
        varyant="tehlike"
        boyut="sm"
        disabled={beklemede || ilanSayisi > 0}
        title={ilanSayisi > 0 ? "İlanı olan kurum silinemez" : undefined}
        onClick={() => {
          if (!window.confirm(`"${ad}" silinsin mi?`)) return;
          baslatGecis(async () => {
            const sonuc = await kurumSil(id);
            if (sonuc?.hata) setHata(sonuc.hata);
          });
        }}
      >
        Sil
      </Button>
      {hata && <span className="text-xs text-danger">{hata}</span>}
    </div>
  );
}
