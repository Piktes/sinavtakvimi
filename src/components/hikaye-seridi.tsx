"use client";

import Image from "next/image";
import { useCallback, useState } from "react";
import { HikayeGoruntuleyici } from "@/components/hikaye-goruntuleyici";

export interface HikayeOzet {
  id: string;
  baslik: string;
  gorselUrl: string;
  baglanti: string | null;
}

// Ana sayfada Instagram hikayesiyle AYNI görünüm: yuvarlak, gradyan
// çerçeveli önizlemelerden oluşan yatay kaydırmalı şerit. Tıklanınca tam
// ekran görüntüleyici açılır (bkz. HikayeGoruntuleyici).
export function HikayeSeridi({ hikayeler }: { hikayeler: HikayeOzet[] }) {
  const [acikIndeks, setAcikIndeks] = useState<number | null>(null);
  // Kimliği sabit kalsın: görüntüleyicinin zamanlayıcısı `onKapat`'a bağlı,
  // her render'da yeni bir fonksiyon üretilirse sayaç boşuna sıfırlanır.
  const kapat = useCallback(() => setAcikIndeks(null), []);

  if (hikayeler.length === 0) return null;

  return (
    <>
      <ul className="serit-orta flex gap-4 overflow-x-auto pb-1">
        {hikayeler.map((hikaye, index) => (
          <li key={hikaye.id} className="flex shrink-0 flex-col items-center gap-1">
            <button
              type="button"
              onClick={() => setAcikIndeks(index)}
              className="hikaye-halka flex size-16 shrink-0 items-center justify-center rounded-full p-0.5"
            >
              <span className="flex size-full items-center justify-center rounded-full bg-bg p-0.5">
                <Image
                  src={hikaye.gorselUrl}
                  alt={hikaye.baslik}
                  width={64}
                  height={64}
                  className="size-full rounded-full object-cover"
                />
              </span>
            </button>
            <span className="line-clamp-1 w-16 text-center text-xs text-text-muted">
              {hikaye.baslik}
            </span>
          </li>
        ))}
      </ul>

      {acikIndeks !== null && (
        <HikayeGoruntuleyici
          hikayeler={hikayeler}
          baslangicIndeksi={acikIndeks}
          onKapat={kapat}
        />
      )}
    </>
  );
}
