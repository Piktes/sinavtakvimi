"use client";

import { Undo2 } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { partiyiGeriAl } from "./actions";

// §4.2: hatalı yükleme tek işlemle geri alınır. Yayınlanmış ilanlar
// korunduğu için sonuç mesajı ikisini ayrı ayrı bildirir.
export function GeriAlButonu({
  partiId,
  etiket = "Geri al",
}: {
  partiId: string;
  etiket?: string;
}) {
  const [mesaj, setMesaj] = useState<string | null>(null);
  const [hata, setHata] = useState<string | null>(null);
  const [beklemede, baslatGecis] = useTransition();

  if (mesaj) {
    return <span className="text-sm text-success">{mesaj}</span>;
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        varyant="tehlike"
        boyut="sm"
        disabled={beklemede}
        onClick={() => {
          if (
            !window.confirm(
              "Bu yüklemeden gelen taslak ilanlar silinecek. Yayınlanmış olanlar korunur. Devam edilsin mi?",
            )
          ) {
            return;
          }
          baslatGecis(async () => {
            const sonuc = await partiyiGeriAl(partiId);
            if (sonuc.hata) {
              setHata(sonuc.hata);
              return;
            }
            setMesaj(
              sonuc.korunan
                ? `${sonuc.silinen} taslak silindi, ${sonuc.korunan} yayınlanmış ilan korundu.`
                : `${sonuc.silinen} ilan geri alındı.`,
            );
          });
        }}
      >
        <Undo2 size={16} strokeWidth={1.75} aria-hidden />
        {beklemede ? "Geri alınıyor…" : etiket}
      </Button>
      {hata && <span className="text-xs text-danger">{hata}</span>}
    </div>
  );
}
