"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { hikayeSil } from "./actions";

export function HikayeSilButonu({ id, baslik }: { id: string; baslik: string }) {
  const [hata, setHata] = useState<string | null>(null);
  const [beklemede, baslatGecis] = useTransition();

  return (
    <div className="flex shrink-0 flex-col items-end">
      <Button
        varyant="tehlike"
        boyut="sm"
        disabled={beklemede}
        onClick={() => {
          if (!window.confirm(`"${baslik}" silinsin mi?`)) return;
          baslatGecis(async () => {
            const sonuc = await hikayeSil(id);
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
