"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { ilanSil, ilanYilKopyala } from "./actions";

export function IlanSatirEylemleri({
  id,
  baslik,
  slug,
}: {
  id: string;
  baslik: string;
  slug: string;
}) {
  const [hata, setHata] = useState<string | null>(null);
  const [beklemede, baslatGecis] = useTransition();

  return (
    <div className="flex shrink-0 items-center gap-1">
      {/* §6 Önizleme: yayınlamadan önce sitede nasıl göründüğü. */}
      <Button varyant="hayalet" boyut="sm">
        <Link href={`/yonetim/ilanlar/${id}/onizleme`}>Önizle</Link>
      </Button>

      <Button varyant="hayalet" boyut="sm">
        <Link href={`/ilan/${slug}`}>Sitede</Link>
      </Button>

      <Button
        varyant="hayalet"
        boyut="sm"
        disabled={beklemede}
        title="Tarihleri +1 yıl kaydırıp taslak olarak kopyalar"
        onClick={() =>
          baslatGecis(async () => {
            const sonuc = await ilanYilKopyala(id);
            if (sonuc?.hata) setHata(sonuc.hata);
          })
        }
      >
        +1 yıl
      </Button>

      <Button
        varyant="tehlike"
        boyut="sm"
        disabled={beklemede}
        onClick={() => {
          if (!window.confirm(`"${baslik}" silinsin mi? Bu işlem geri alınamaz.`)) return;
          baslatGecis(async () => {
            const sonuc = await ilanSil(id);
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
