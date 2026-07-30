"use client";

import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { HikayeOzet } from "@/components/hikaye-seridi";

const SURE_MS = 5000;

// Tam ekran hikaye görüntüleyici — Instagram'daki gibi karartılmış zemin
// üzerinde fotoğraf. Bu zemin bilerek site temasından (açık/koyu) bağımsız,
// her zaman koyu: gerçek fotoğraf üstüne bindiği için ışık/karanlık tema
// değişimi burada anlamsız — tıpkı bir ışık kutusu/foto görüntüleyici gibi.
export function HikayeGoruntuleyici({
  hikayeler,
  baslangicIndeksi,
  onKapat,
}: {
  hikayeler: HikayeOzet[];
  baslangicIndeksi: number;
  onKapat: () => void;
}) {
  const [indeks, setIndeks] = useState(baslangicIndeksi);
  const [ilerleme, setIlerleme] = useState(0);

  // Son hikaye bitince kapanır. `onKapat` bir setIndeks GÜNCELLEYİCİSİNİN
  // İÇİNDEN çağrılmamalı: React güncelleyiciyi render sırasında çalıştırır,
  // orada üst bileşenin state'ini değiştirmek "Cannot update a component
  // while rendering a different component" hatası verir. Bu yüzden karar
  // güncelleyicinin dışında, mevcut `indeks` üzerinden veriliyor.
  const sonrakine = useCallback(() => {
    if (indeks >= hikayeler.length - 1) {
      onKapat();
      return;
    }
    setIndeks(indeks + 1);
    setIlerleme(0);
  }, [indeks, hikayeler.length, onKapat]);

  const oncekine = useCallback(() => {
    setIndeks((onceki) => Math.max(onceki - 1, 0));
    setIlerleme(0);
  }, []);

  useEffect(() => {
    const baslangic = Date.now();
    const zamanlayici = setInterval(() => {
      const yuzde = Math.min(((Date.now() - baslangic) / SURE_MS) * 100, 100);
      setIlerleme(yuzde);
      if (yuzde >= 100) {
        // Yeniden render olana kadar aralık tekrar tetiklenip iki hikaye
        // birden atlamasın diye burada durduruluyor.
        clearInterval(zamanlayici);
        sonrakine();
      }
    }, 50);
    return () => clearInterval(zamanlayici);
  }, [sonrakine]);

  useEffect(() => {
    function tusaBas(olay: KeyboardEvent) {
      if (olay.key === "Escape") onKapat();
      if (olay.key === "ArrowRight") sonrakine();
      if (olay.key === "ArrowLeft") oncekine();
    }
    window.addEventListener("keydown", tusaBas);
    return () => window.removeEventListener("keydown", tusaBas);
  }, [onKapat, sonrakine, oncekine]);

  const hikaye = hikayeler[indeks];

  return (
    <div
      className="hikaye-zemin fixed inset-0 z-50 flex items-center justify-center"
      onClick={onKapat}
    >
      <div
        className="relative h-full w-full max-w-md overflow-hidden sm:h-[90vh] sm:rounded-lg"
        onClick={(olay) => olay.stopPropagation()}
      >
        {/* Görsel ve dokunma alanları önce — üstteki ilerleme çubuğu/kapat/
         * altyazı z-10 ile bunların HER ZAMAN üstünde kalır, DOM sırası
         * içindeki göreli konumdan bağımsız. */}
        <Image src={hikaye.gorselUrl} alt={hikaye.baslik} fill className="object-contain" />

        <button
          type="button"
          aria-label="Önceki hikaye"
          onClick={oncekine}
          className="absolute inset-y-0 left-0 w-1/3"
        />
        <button
          type="button"
          aria-label="Sonraki hikaye"
          onClick={sonrakine}
          className="absolute inset-y-0 right-0 w-1/3"
        />

        <div className="absolute inset-x-0 top-0 z-10 flex gap-1 p-2">
          {hikayeler.map((h, i) => (
            <div key={h.id} className="hikaye-ilerleme-yolu h-1 flex-1 overflow-hidden rounded-full">
              <div
                className="hikaye-ilerleme-dolu h-full"
                style={{ width: `${i < indeks ? 100 : i === indeks ? ilerleme : 0}%` }}
              />
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onKapat}
          aria-label="Kapat"
          className="hikaye-kapat absolute top-6 right-2 z-10 p-1"
        >
          <X size={24} strokeWidth={1.75} aria-hidden />
        </button>

        <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col gap-3 p-4">
          <p className="hikaye-metin font-baslik text-lg font-semibold">{hikaye.baslik}</p>
          {hikaye.baglanti && (
            <Link
              href={hikaye.baglanti}
              className="hikaye-cta w-fit rounded-md px-3 py-1.5 text-sm font-medium"
            >
              Görüntüle
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
