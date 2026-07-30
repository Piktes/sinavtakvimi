"use client";

import { Check, Trash2, X, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { yorumlariKararaBagla, yorumSilKalici } from "@/app/yonetim/(panel)/yorumlar/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Yildiz } from "@/components/yildiz";
import { kuralAciklamasi } from "@/lib/moderasyon/on-filtre";

export interface KuyrukYorumu {
  id: string;
  puan: number | null;
  icerik: string;
  durum: string;
  otomatikSkor: number;
  moderasyonNotu: string | null;
  olusturulmaMetni: string;
  takmaAd: string | null;
  ilan: { baslik: string; slug: string };
}

const DURUM_ROZETI: Record<
  string,
  { etiket: string; varyant: "notr" | "basari" | "tehlike" | "uyari" }
> = {
  BEKLIYOR: { etiket: "Bekliyor", varyant: "uyari" },
  ONAYLANDI: { etiket: "Onaylandı", varyant: "basari" },
  REDDEDILDI: { etiket: "Reddedildi", varyant: "tehlike" },
  SPAM: { etiket: "Spam", varyant: "tehlike" },
};

// §6: "kuyruk, otomatik filtre skoru ve tetiklenen kural, toplu işlem,
// klavye kısayolları (a onayla, r reddet, j/k gezin)."
//
// Moderasyon hacimli bir iş: 800-1200 ilana yorum gelecek. Fareyle tek tek
// tıklamak yerine klavyeden akıp gitmek gerekiyor.
export function ModerasyonKuyrugu({ yorumlar }: { yorumlar: KuyrukYorumu[] }) {
  const [imlec, setImlec] = useState(0);
  const [secililer, setSecililer] = useState<Set<string>>(new Set());
  const [mesaj, setMesaj] = useState<string | null>(null);
  const [bekleniyor, basla] = useTransition();
  const satirRefleri = useRef<(HTMLLIElement | null)[]>([]);

  const kararVer = useCallback((idler: string[], karar: "ONAYLANDI" | "REDDEDILDI" | "SPAM") => {
    if (idler.length === 0) return;
    basla(async () => {
      const sonuc = await yorumlariKararaBagla({ yorumIdleri: idler, karar });
      setMesaj(sonuc.hata ?? sonuc.bilgi ?? null);
      setSecililer(new Set());
    });
  }, []);

  const secimiCevir = useCallback((id: string) => {
    setSecililer((onceki) => {
      const yeni = new Set(onceki);
      if (yeni.has(id)) yeni.delete(id);
      else yeni.add(id);
      return yeni;
    });
  }, []);

  useEffect(() => {
    function tus(olay: KeyboardEvent) {
      // Form alanındayken kısayollar devre dışı — moderatör not yazarken
      // "a" tuşu onay tetiklememeli.
      const hedef = olay.target as HTMLElement;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(hedef.tagName) || hedef.isContentEditable) {
        return;
      }
      if (olay.metaKey || olay.ctrlKey || olay.altKey) return;

      const mevcut = yorumlar[imlec];

      switch (olay.key) {
        case "j":
          olay.preventDefault();
          setImlec((i) => Math.min(i + 1, yorumlar.length - 1));
          break;
        case "k":
          olay.preventDefault();
          setImlec((i) => Math.max(i - 1, 0));
          break;
        case "a":
          if (!mevcut) return;
          olay.preventDefault();
          kararVer(secililer.size > 0 ? [...secililer] : [mevcut.id], "ONAYLANDI");
          break;
        case "r":
          if (!mevcut) return;
          olay.preventDefault();
          kararVer(secililer.size > 0 ? [...secililer] : [mevcut.id], "REDDEDILDI");
          break;
        case "s":
          if (!mevcut) return;
          olay.preventDefault();
          kararVer(secililer.size > 0 ? [...secililer] : [mevcut.id], "SPAM");
          break;
        case "x":
          if (!mevcut) return;
          olay.preventDefault();
          secimiCevir(mevcut.id);
          break;
        default:
      }
    }

    document.addEventListener("keydown", tus);
    return () => document.removeEventListener("keydown", tus);
  }, [imlec, yorumlar, secililer, kararVer, secimiCevir]);

  // İmleç ekran dışına çıkmasın.
  useEffect(() => {
    satirRefleri.current[imlec]?.scrollIntoView({ block: "nearest" });
  }, [imlec]);

  // Sonuç mesajı listeden ÖNCE render ediliyor: son öğe karara bağlanınca
  // liste boşalıyor ve mesaj erken return'e takılıp kayboluyordu.
  const durumMesaji = mesaj && (
    <p role="status" className="rounded-md bg-success-bg px-3 py-2 text-sm text-success">
      {mesaj}
    </p>
  );

  if (yorumlar.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        {durumMesaji}
        <EmptyState ikon={Check} baslik="Kuyruk boş" aciklama="Bu filtrede bekleyen yorum yok." />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-surface p-2">
        <span className="text-sm text-text-muted">
          {secililer.size > 0 ? `${secililer.size} seçili` : `${yorumlar.length} yorum`}
        </span>

        <div className="ml-auto flex items-center gap-2">
          <Button
            boyut="sm"
            disabled={bekleniyor || secililer.size === 0}
            onClick={() => kararVer([...secililer], "ONAYLANDI")}
          >
            <Check size={14} strokeWidth={1.75} aria-hidden />
            Onayla
          </Button>
          <Button
            varyant="ikincil"
            boyut="sm"
            disabled={bekleniyor || secililer.size === 0}
            onClick={() => kararVer([...secililer], "REDDEDILDI")}
          >
            <X size={14} strokeWidth={1.75} aria-hidden />
            Reddet
          </Button>
          <Button
            varyant="tehlike"
            boyut="sm"
            disabled={bekleniyor || secililer.size === 0}
            onClick={() => kararVer([...secililer], "SPAM")}
          >
            <AlertTriangle size={14} strokeWidth={1.75} aria-hidden />
            Spam
          </Button>
        </div>
      </div>

      <p className="text-xs text-text-muted">
        Klavye: <kbd className="sayisal">j</kbd>/<kbd className="sayisal">k</kbd> gezin ·{" "}
        <kbd className="sayisal">x</kbd> seç · <kbd className="sayisal">a</kbd> onayla ·{" "}
        <kbd className="sayisal">r</kbd> reddet · <kbd className="sayisal">s</kbd> spam. Seçim varsa
        kısayol seçilenlerin tümüne uygulanır.
      </p>

      {durumMesaji}

      <ul className="flex flex-col gap-2">
        {yorumlar.map((yorum, sira) => {
          const rozet = DURUM_ROZETI[yorum.durum] ?? DURUM_ROZETI.BEKLIYOR;
          const kurallar = yorum.moderasyonNotu?.split(" · ").filter(Boolean) ?? [];

          return (
            <li
              key={yorum.id}
              ref={(el) => {
                satirRefleri.current[sira] = el;
              }}
              onClick={() => setImlec(sira)}
              className={`flex gap-3 rounded-md border bg-surface p-3 ${
                sira === imlec ? "border-primary" : "border-border"
              }`}
            >
              <input
                type="checkbox"
                aria-label="Seç"
                checked={secililer.has(yorum.id)}
                onChange={() => secimiCevir(yorum.id)}
                className="mt-1"
              />

              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge varyant={rozet.varyant}>{rozet.etiket}</Badge>
                  <span className="text-sm font-medium text-text">
                    {yorum.takmaAd ?? "Silinmiş hesap"}
                  </span>
                  {yorum.puan !== null && <Yildiz deger={yorum.puan} boyut={13} />}
                  <span className="text-xs text-text-faint">{yorum.olusturulmaMetni}</span>
                  {yorum.otomatikSkor > 0 && (
                    <span className="sayisal text-xs text-warning">
                      skor {yorum.otomatikSkor.toFixed(2)}
                    </span>
                  )}
                </div>

                <Link
                  href={`/ilan/${yorum.ilan.slug}`}
                  target="_blank"
                  className="w-fit text-xs text-text-muted underline-offset-4 hover:underline"
                >
                  {yorum.ilan.baslik}
                </Link>

                {/* §7: kullanıcı içeriği HTML olarak render edilmez. */}
                {yorum.icerik ? (
                  <p className="text-sm whitespace-pre-line text-text">{yorum.icerik}</p>
                ) : (
                  <p className="text-sm text-text-faint">(yalnızca puan verilmiş)</p>
                )}

                {/* §6: "otomatik filtre skoru ve TETİKLENEN KURAL" — moderatör
                 * neden bayraklandığını görmeden karar veremez. */}
                {kurallar.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {kurallar.map((kural) => (
                      <Badge key={kural} varyant="cizgi">
                        {kuralAciklamasi(kural)}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex shrink-0 flex-col gap-1">
                <Button
                  boyut="ikonSm"
                  title="Onayla (a)"
                  disabled={bekleniyor}
                  onClick={() => kararVer([yorum.id], "ONAYLANDI")}
                >
                  <Check size={14} strokeWidth={2} aria-hidden />
                </Button>
                <Button
                  varyant="ikincil"
                  boyut="ikonSm"
                  title="Reddet (r)"
                  disabled={bekleniyor}
                  onClick={() => kararVer([yorum.id], "REDDEDILDI")}
                >
                  <X size={14} strokeWidth={2} aria-hidden />
                </Button>
                <Button
                  varyant="hayalet"
                  boyut="ikonSm"
                  title="Kalıcı sil"
                  disabled={bekleniyor}
                  onClick={() =>
                    basla(async () => {
                      const sonuc = await yorumSilKalici(yorum.id);
                      setMesaj(sonuc.hata ?? sonuc.bilgi ?? null);
                    })
                  }
                >
                  <Trash2 size={14} strokeWidth={1.75} aria-hidden />
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
