"use client";

import { Star } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useActionState, useState } from "react";
import { yorumGonder, type YorumDurumu } from "@/app/(genel)/yorum-actions";
import { Button } from "@/components/ui/button";
import { Label, Textarea } from "@/components/ui/input";
import { YORUM_EN_COK } from "@/lib/validations/yorum";

const baslangic: YorumDurumu = {};

export function YorumFormu({
  ilanId,
  girisli,
  epostaDogrulandi,
  mevcut,
}: {
  ilanId: string;
  girisli: boolean;
  epostaDogrulandi: boolean;
  /** Kullanıcının bu ilana daha önce yazdığı yorum — varsa form doludur. */
  mevcut: { puan: number | null; icerik: string; durum: string } | null;
}) {
  const yol = usePathname();
  const [durum, eylem, bekleniyor] = useActionState(yorumGonder, baslangic);
  const [puan, setPuan] = useState(mevcut?.puan ?? 0);
  const [icerik, setIcerik] = useState(mevcut?.icerik ?? "");

  if (!girisli) {
    return (
      <div className="rounded-md border border-dashed border-border p-4 text-sm text-text-muted">
        Yorum yapmak ve puan vermek için{" "}
        <Link href={`/giris?devam=${encodeURIComponent(yol)}`} className="underline">
          giriş yapın
        </Link>
        .
      </div>
    );
  }

  if (!epostaDogrulandi) {
    return (
      <p className="rounded-md bg-warning-bg px-3 py-2 text-sm text-warning">
        Yorum yapabilmek için önce e-posta adresinizi doğrulayın.
      </p>
    );
  }

  if (durum.bilgi) {
    return (
      <p role="status" className="rounded-md bg-success-bg px-3 py-2 text-sm text-success">
        {durum.bilgi}
      </p>
    );
  }

  return (
    <form action={eylem} className="flex flex-col gap-3">
      <input type="hidden" name="ilanId" value={ilanId} />
      {/* Yıldızlar düğme; seçilen değer gizli alanla gönderiliyor. */}
      <input type="hidden" name="puan" value={puan || ""} />

      <div className="flex flex-col gap-1.5">
        <Label>Puanınız</Label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((deger) => (
            <button
              key={deger}
              type="button"
              aria-label={`${deger} yıldız`}
              aria-pressed={puan === deger}
              onClick={() => setPuan(puan === deger ? 0 : deger)}
              className="rounded-sm p-0.5 transition-colors hover:bg-surface-hover"
            >
              <Star
                size={22}
                strokeWidth={1.75}
                aria-hidden
                className={deger <= puan ? "fill-warning text-warning" : "text-text-faint"}
              />
            </button>
          ))}
          {puan > 0 && (
            <button
              type="button"
              onClick={() => setPuan(0)}
              className="ml-1 text-xs text-text-muted underline-offset-4 hover:underline"
            >
              Temizle
            </button>
          )}
        </div>
        {durum.alanHatalari?.puan && (
          <p className="text-sm text-danger">{durum.alanHatalari.puan}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="icerik">Yorumunuz (isteğe bağlı)</Label>
        <Textarea
          id="icerik"
          name="icerik"
          rows={4}
          maxLength={YORUM_EN_COK}
          value={icerik}
          onChange={(olay) => setIcerik(olay.target.value)}
          placeholder="Deneme hakkındaki görüşünüz…"
        />
        <div className="flex items-center justify-between text-xs text-text-muted">
          {/* §4.9 / §7: kişisel veri paylaşımı otomatik reddediliyor;
           * kullanıcı bunu yazmadan ÖNCE bilmeli. */}
          <span>Telefon, e-posta ve sosyal medya hesabı yazmayın — otomatik reddedilir.</span>
          <span className="sayisal">
            {icerik.length}/{YORUM_EN_COK}
          </span>
        </div>
        {durum.alanHatalari?.icerik && (
          <p className="text-sm text-danger">{durum.alanHatalari.icerik}</p>
        )}
      </div>

      {durum.hata && (
        <p role="alert" className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">
          {durum.hata}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" boyut="sm" disabled={bekleniyor}>
          {bekleniyor ? "Gönderiliyor…" : mevcut ? "Yorumumu güncelle" : "Gönder"}
        </Button>
        <span className="text-xs text-text-muted">
          {mevcut
            ? "Güncellenen yorum yeniden onaya düşer."
            : "Yorumlar moderatör onayından sonra yayınlanır."}
        </span>
      </div>
    </form>
  );
}
