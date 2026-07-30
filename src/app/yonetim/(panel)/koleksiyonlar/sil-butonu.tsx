"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { koleksiyonSil } from "./actions";

export function KoleksiyonSilButonu({ id, ad }: { id: string; ad: string }) {
  const [hata, setHata] = useState<string | null>(null);
  const [beklemede, baslatGecis] = useTransition();

  return (
    <div className="flex shrink-0 flex-col items-end">
      <Button
        varyant="tehlike"
        boyut="sm"
        disabled={beklemede}
        onClick={() => {
          if (!window.confirm(`"${ad}" sekmesi silinsin mi?`)) return;
          baslatGecis(async () => {
            const sonuc = await koleksiyonSil(id);
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
