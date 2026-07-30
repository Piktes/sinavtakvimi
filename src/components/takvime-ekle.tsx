"use client";

import { CalendarPlus, Download, Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

// §4.7: "Google Takvim şablon bağlantısı + .ics indirme. OAuth yok."
// İki seçenek tek düğmenin altında; menü dışına tıklanınca kapanır.
export function TakvimeEkle({
  googleUrl,
  icsUrl,
  akisUrl,
  akisEtiketi,
}: {
  googleUrl: string;
  icsUrl: string;
  /** Yayınevinin tüm ilanlarını kapsayan abone olunabilir akış. */
  akisUrl?: string;
  akisEtiketi?: string;
}) {
  const [acik, setAcik] = useState(false);
  const [kopyalandi, setKopyalandi] = useState(false);
  const kapsayici = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!acik) return;

    const disariTiklama = (olay: MouseEvent) => {
      if (!kapsayici.current?.contains(olay.target as Node)) setAcik(false);
    };
    const kacis = (olay: KeyboardEvent) => {
      if (olay.key === "Escape") setAcik(false);
    };

    document.addEventListener("mousedown", disariTiklama);
    document.addEventListener("keydown", kacis);
    return () => {
      document.removeEventListener("mousedown", disariTiklama);
      document.removeEventListener("keydown", kacis);
    };
  }, [acik]);

  async function akisiKopyala() {
    if (!akisUrl) return;
    const tam = new URL(akisUrl, window.location.origin).toString();
    try {
      await navigator.clipboard.writeText(tam);
      setKopyalandi(true);
      setTimeout(() => setKopyalandi(false), 2500);
    } catch {
      // Pano izni yoksa kullanıcı bağlantıyı elle kopyalayabilsin.
      window.prompt("Takvim akışı adresi:", tam);
    }
  }

  return (
    <div ref={kapsayici} className="relative">
      <Button
        varyant="birincil"
        boyut="md"
        aria-expanded={acik}
        aria-haspopup="menu"
        onClick={() => setAcik((o) => !o)}
      >
        <CalendarPlus size={16} strokeWidth={1.75} aria-hidden />
        Takvime ekle
      </Button>

      {acik && (
        <div
          role="menu"
          className="absolute left-0 top-full z-20 mt-1 flex w-72 flex-col gap-1 rounded-md border border-border bg-surface p-1 shadow-md"
        >
          <a
            role="menuitem"
            href={googleUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setAcik(false)}
            className="flex flex-col gap-0.5 rounded-sm px-3 py-2 text-left text-sm text-text hover:bg-surface-hover"
          >
            <span className="font-medium">Google Takvim</span>
            <span className="text-xs text-text-muted">Yeni sekmede açılır, izin istemez.</span>
          </a>

          <a
            role="menuitem"
            href={icsUrl}
            onClick={() => setAcik(false)}
            className="flex flex-col gap-0.5 rounded-sm px-3 py-2 text-left text-sm text-text hover:bg-surface-hover"
          >
            <span className="flex items-center gap-1.5 font-medium">
              <Download size={14} strokeWidth={1.75} aria-hidden />
              .ics indir
            </span>
            <span className="text-xs text-text-muted">
              Apple Takvim, Outlook ve diğerleri için.
            </span>
          </a>

          {akisUrl && (
            <button
              type="button"
              role="menuitem"
              onClick={akisiKopyala}
              className="flex flex-col gap-0.5 rounded-sm border-t border-border px-3 py-2 text-left text-sm text-text hover:bg-surface-hover"
            >
              <span className="flex items-center gap-1.5 font-medium">
                {kopyalandi && <Check size={14} strokeWidth={2} aria-hidden />}
                {kopyalandi ? "Adres kopyalandı" : (akisEtiketi ?? "Tüm takvime abone ol")}
              </span>
              <span className="text-xs text-text-muted">
                Takvim uygulamanıza ekleyin; tarih değişince kendiliğinden güncellenir.
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
