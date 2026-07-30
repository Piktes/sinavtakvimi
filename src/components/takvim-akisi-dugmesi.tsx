"use client";

import { Check, CalendarPlus, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

// Katman sırası: yapışkan üst bar z-30, yapışkan filtre çubuğu z-20 (bkz.
// takvim/filtre-cubugu.tsx). Açılır menü ikisinin de üstünde durmalı — z-20
// verildiğinde koleksiyon sayfasında filtre çubuğu menüyü kapatıyordu.
// §4.7: "abone olunabilir akışlar — kullanıcı bir kez ekler, tarih değişince
// takvimi kendiliğinden güncellenir."
//
// Abone olmanın tek yolu akış adresini takvim uygulamasına yapıştırmak
// (bir düğmeyle bunu yapan standart bir arayüz yok). Bu yüzden birincil
// eylem "adresi kopyala"; .ics indirme tek seferlik anlık görüntü olduğu
// için ikincil ve böyle etiketlendi.
export function TakvimAkisiDugmesi({ akisUrl, ad }: { akisUrl: string; ad: string }) {
  const [acik, setAcik] = useState(false);
  const [kopyalandi, setKopyalandi] = useState(false);
  const kapsayici = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!acik) return;
    const disari = (o: MouseEvent) => {
      if (!kapsayici.current?.contains(o.target as Node)) setAcik(false);
    };
    const kacis = (o: KeyboardEvent) => o.key === "Escape" && setAcik(false);
    document.addEventListener("mousedown", disari);
    document.addEventListener("keydown", kacis);
    return () => {
      document.removeEventListener("mousedown", disari);
      document.removeEventListener("keydown", kacis);
    };
  }, [acik]);

  const tamAdres = () => new URL(akisUrl, window.location.origin).toString();

  async function kopyala() {
    try {
      await navigator.clipboard.writeText(tamAdres());
      setKopyalandi(true);
      setTimeout(() => setKopyalandi(false), 2500);
    } catch {
      window.prompt("Takvim akışı adresi:", tamAdres());
    }
  }

  return (
    <div ref={kapsayici} className="relative">
      <Button
        varyant="ikincil"
        boyut="sm"
        aria-expanded={acik}
        aria-haspopup="menu"
        onClick={() => setAcik((o) => !o)}
      >
        <CalendarPlus size={16} strokeWidth={1.75} aria-hidden />
        Takvime abone ol
      </Button>

      {acik && (
        <div
          role="menu"
          className="absolute right-0 top-full z-40 mt-1 flex w-80 flex-col gap-2 rounded-md border border-border bg-surface p-3 shadow-md"
        >
          <p className="text-sm text-text">
            <span className="font-medium">{ad}</span> takvimini kendi takvim uygulamanıza ekleyin.
            Tarihler değişirse kaydınız kendiliğinden güncellenir.
          </p>

          <div className="flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded-sm bg-bg-subtle px-2 py-1 text-xs text-text-muted">
              {akisUrl}
            </code>
            <Button varyant="ikincil" boyut="sm" onClick={kopyala}>
              {kopyalandi ? (
                <Check size={14} strokeWidth={2} aria-hidden />
              ) : (
                <Copy size={14} strokeWidth={1.75} aria-hidden />
              )}
              {kopyalandi ? "Kopyalandı" : "Kopyala"}
            </Button>
          </div>

          <p className="text-xs text-text-muted">
            Google Takvim &rsaquo; Diğer takvimler &rsaquo; URL&apos;den ekle · Apple Takvim
            &rsaquo; Dosya &rsaquo; Yeni Takvim Aboneliği
          </p>

          <a
            href={akisUrl}
            onClick={() => setAcik(false)}
            className="border-t border-border pt-2 text-xs text-text-muted underline-offset-4 hover:underline"
          >
            Ya da .ics dosyasını indir (anlık görüntü, güncellenmez)
          </a>
        </div>
      )}
    </div>
  );
}
