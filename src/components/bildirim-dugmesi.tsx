"use client";

import { Bell, BellRing, Check } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { aboneOl, abonelikKapat } from "@/app/(genel)/abonelik-actions";
import { Button } from "@/components/ui/button";
import {
  IZINLI_OFSETLER,
  OFSET_ETIKETLERI,
  VARSAYILAN_OFSETLER,
  ofsetleriOzetle,
  type AbonelikDurumu,
  type AbonelikHedefi,
} from "@/lib/abonelik";

// Katman sırası: yapışkan üst bar z-30, yapışkan filtre çubuğu z-20 (bkz.
// takvim/filtre-cubugu.tsx). Açılır menü ikisinin de üstünde durmalı — z-20
// verildiğinde koleksiyon sayfasında filtre çubuğu menüyü kapatıyordu.
// §4.8: dört seviyeden birini seçmenin arayüzü. "Kapalı" ayrı bir seçenek
// değil — aboneliği kaldırmak zaten kapalı demek, bu yüzden menüde tek bir
// "Bildirimi kapat" eylemi var, dördüncü bir radyo düğmesi değil.
export function BildirimDugmesi({
  hedef,
  hedefId,
  ad,
  baslangic,
  boyut = "md",
}: {
  hedef: AbonelikHedefi;
  hedefId: string;
  /** Menüde "X için hatırlat" cümlesinde geçer. */
  ad: string;
  baslangic: AbonelikDurumu;
  boyut?: "sm" | "md";
}) {
  const [durum, setDurum] = useState(baslangic);
  const [secili, setSecili] = useState<number[]>(
    baslangic.ofsetler.length ? baslangic.ofsetler : VARSAYILAN_OFSETLER,
  );
  const [acik, setAcik] = useState(false);
  const [bekleniyor, basla] = useTransition();
  const kapsayici = useRef<HTMLDivElement>(null);
  const yol = usePathname();

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

  function ofsetiCevir(ofset: number) {
    setSecili((onceki) =>
      onceki.includes(ofset) ? onceki.filter((o) => o !== ofset) : [...onceki, ofset],
    );
  }

  function kaydet() {
    basla(async () => {
      const sonuc = await aboneOl({ hedef, hedefId, ofsetler: secili });
      setDurum(sonuc);
      if (sonuc.aboneMi) {
        setSecili(sonuc.ofsetler);
        setAcik(false);
      }
    });
  }

  function kapat() {
    basla(async () => {
      const sonuc = await abonelikKapat({ hedef, hedefId });
      setDurum(sonuc);
      setSecili(VARSAYILAN_OFSETLER);
      setAcik(false);
    });
  }

  // Girişsiz kullanıcı düğmeyi görür ama tıklayınca giriş sayfasına gider —
  // "önce üye ol" duvarı koymak yerine niyetini koruyup geri getiriyoruz.
  if (durum.girisGerekli) {
    return (
      <Link href={`/giris?devam=${encodeURIComponent(yol)}`}>
        <Button varyant="ikincil" boyut={boyut}>
          <Bell size={16} strokeWidth={1.75} aria-hidden />
          Bildirim al
        </Button>
      </Link>
    );
  }

  return (
    <div ref={kapsayici} className="relative">
      <Button
        varyant={durum.aboneMi ? "vurgu" : "ikincil"}
        boyut={boyut}
        aria-expanded={acik}
        aria-haspopup="menu"
        onClick={() => setAcik((o) => !o)}
      >
        {durum.aboneMi ? (
          <BellRing size={16} strokeWidth={1.75} aria-hidden />
        ) : (
          <Bell size={16} strokeWidth={1.75} aria-hidden />
        )}
        {durum.aboneMi ? "Bildirim açık" : "Bildirim al"}
      </Button>

      {acik && (
        <div
          role="menu"
          className="absolute right-0 top-full z-40 mt-1 flex w-72 flex-col gap-3 rounded-md border border-border bg-surface p-3 shadow-md"
        >
          <p className="text-sm text-text">
            <span className="font-medium">{ad}</span> için ne zaman hatırlatalım?
          </p>

          <div className="flex flex-col gap-1.5">
            {IZINLI_OFSETLER.map((ofset) => (
              <label
                key={ofset}
                className="flex cursor-pointer items-center gap-2 text-sm text-text"
              >
                <input
                  type="checkbox"
                  checked={secili.includes(ofset)}
                  onChange={() => ofsetiCevir(ofset)}
                />
                {OFSET_ETIKETLERI[ofset]}
              </label>
            ))}
          </div>

          {secili.length === 0 && (
            <p className="text-xs text-warning">
              Hiçbiri seçili değil — kaydederseniz bildirim gönderilmez.
            </p>
          )}

          {durum.hata && (
            <p role="alert" className="text-xs text-danger">
              {durum.hata}
              {durum.hata.includes("doğrula") && (
                <>
                  {" "}
                  <Link href="/giris" className="underline">
                    Bağlantıyı yeniden gönder
                  </Link>
                </>
              )}
            </p>
          )}

          <div className="flex items-center gap-2">
            <Button boyut="sm" onClick={kaydet} disabled={bekleniyor}>
              {bekleniyor ? "Kaydediliyor…" : durum.aboneMi ? "Güncelle" : "Bildirim al"}
            </Button>
            {durum.aboneMi && (
              <Button varyant="hayalet" boyut="sm" onClick={kapat} disabled={bekleniyor}>
                Bildirimi kapat
              </Button>
            )}
          </div>

          {durum.aboneMi && (
            <p className="flex items-center gap-1 border-t border-border pt-2 text-xs text-text-muted">
              <Check size={12} strokeWidth={2} aria-hidden />
              Şu an: {ofsetleriOzetle(durum.ofsetler)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
