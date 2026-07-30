"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

// Kaydırarak görünüme girince içerik canlanarak belirir — tek seferlik,
// tekrar gizlenmez (yukarı/aşağı kaydırmada titreşim olmasın diye).
// `gecikme` (ms) art arda gelen kartlarda sıralı (staggered) belirme için.
//
// §5: `hareket` versiyon imzasıdır — V1 yukarı kayar (varsayılan), V2 magazin
// gibi yandan girer, V3 uygulama gibi ölçeklenir. Geçiş tanımları
// globals.css'te (`[data-hareket]`).
export type ScrollHareketi = "yukari" | "kayar" | "olcek";

export function ScrollBelir({
  children,
  className,
  gecikme = 0,
  hareket = "yukari",
  as: Etiket = "div",
}: {
  children: React.ReactNode;
  className?: string;
  gecikme?: number;
  hareket?: ScrollHareketi;
  as?: "div" | "section";
}) {
  const ref = useRef<HTMLElement>(null);
  const [gorunur, setGorunur] = useState(false);

  useEffect(() => {
    const eleman = ref.current;
    if (!eleman) return;

    const gozlemci = new IntersectionObserver(
      ([girdi]) => {
        if (girdi.isIntersecting) {
          setGorunur(true);
          gozlemci.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
    );
    gozlemci.observe(eleman);
    return () => gozlemci.disconnect();
  }, []);

  return (
    <Etiket
      ref={ref as React.Ref<HTMLDivElement & HTMLElement>}
      data-hareket={hareket === "yukari" ? undefined : hareket}
      className={cn("scroll-belir", gorunur && "gorunur", className)}
      style={gecikme ? { transitionDelay: `${gecikme}ms` } : undefined}
    >
      {children}
    </Etiket>
  );
}
