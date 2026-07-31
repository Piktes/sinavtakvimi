"use client";

import { useEffect, useRef, useState } from "react";

// Üst bar kaydırmaya tepki verir (üç versiyonda da): daralır, camlaşır ve
// altında okuma ilerlemesi çizgisi belirir.
//
// Durum bayrağı <html data-kaydi> üzerinde tutuluyor; üst barın yüksekliği
// sayfanın başka yerlerindeki yapışkan öğeleri de ilgilendirdiği için
// (bkz. globals.css `--ust-bar-yuksekligi`). Görünüm tanımları CSS'te.
export function UstBarKabuk({ children }: { children: React.ReactNode }) {
  const [ilerleme, setIlerleme] = useState(0);
  // Aynı değeri tekrar yazıp gereksiz DOM dokunuşu yapmamak için.
  const sonDurum = useRef<string>("");
  const barRef = useRef<HTMLElement>(null);

  // Yükseklik SABİT SAYIYLA yazılmıyor: yazı tipi, sekme sayısı ya da satır
  // kaymasıyla değişebiliyor. Gerçek yükseklik ölçülüp değişkene yazılır,
  // yapışkan öğeler (filtre çubuğu, hafta şeridi) onu okur.
  useEffect(() => {
    const eleman = barRef.current;
    if (!eleman) return;

    const gozlemci = new ResizeObserver(([girdi]) => {
      const yukseklik = Math.round(girdi.contentRect.height);
      document.documentElement.style.setProperty("--ust-bar-yuksekligi", `${yukseklik}px`);
    });
    gozlemci.observe(eleman);
    return () => {
      gozlemci.disconnect();
      document.documentElement.style.removeProperty("--ust-bar-yuksekligi");
    };
  }, []);

  useEffect(() => {
    function kontrol() {
      const y = window.scrollY;

      // Histerezis: tek bir eşik (ör. 8px) en ufak dokunuşta sekme
      // satırını anında kapatıyor, "birden kayboluyor" hissi veriyordu.
      // Kapanmak için daha uzun kaydırma (32px), açılmak için tepeye
      // dönüş (8px) gerekiyor — ikisi arasında son durum korunur.
      const kapaliMi = sonDurum.current === "evet";
      const durum = (kapaliMi ? y > 8 : y > 32) ? "evet" : "hayir";
      if (durum !== sonDurum.current) {
        document.documentElement.dataset.kaydi = durum;
        sonDurum.current = durum;
      }

      // Sayfa kaydırılamıyorsa (içerik kısa) çizgi hep boş kalsın.
      const kaydirilabilir = document.documentElement.scrollHeight - window.innerHeight;
      setIlerleme(kaydirilabilir > 0 ? Math.min(y / kaydirilabilir, 1) : 0);
    }

    kontrol();
    window.addEventListener("scroll", kontrol, { passive: true });
    window.addEventListener("resize", kontrol);
    return () => {
      window.removeEventListener("scroll", kontrol);
      window.removeEventListener("resize", kontrol);
      // Sayfadan ayrılırken bayrağı bırakma — sonraki sayfa daralmış başlamasın.
      delete document.documentElement.dataset.kaydi;
    };
  }, []);

  return (
    <header ref={barRef} className="ust-bar sticky top-0 z-30 border-b border-border bg-surface">
      {children}
      <div
        aria-hidden
        className="ilerleme-cizgisi"
        style={{ transform: `scaleX(${ilerleme})` }}
      />
    </header>
  );
}
