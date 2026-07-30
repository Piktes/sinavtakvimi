"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardGovde } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { kurumRengi } from "@/lib/kurum-tonu";
import { kurumKaydet, type KurumFormDurumu } from "./actions";

const baslangic: KurumFormDurumu = {};

export interface KurumBaslangic {
  id: string;
  ad: string;
  slug: string;
  tipId: string;
  logoUrl: string | null;
  webSitesi: string | null;
  aciklamaMd: string | null;
  sira: number;
  aktifMi: boolean;
}

export function KurumFormu({
  kurum,
  tipler,
}: {
  kurum?: KurumBaslangic;
  tipler: { id: string; ad: string }[];
}) {
  const [durum, eylem, beklemede] = useActionState(kurumKaydet, baslangic);
  const [tipId, setTipId] = useState(kurum?.tipId ?? "");

  return (
    <form action={eylem} className="flex max-w-2xl flex-col gap-4">
      <input type="hidden" name="id" value={kurum?.id ?? ""} />

      <Card>
        <CardGovde className="flex flex-col gap-3 p-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ad">Ad</Label>
            <Input id="ad" name="ad" defaultValue={kurum?.ad} required />
            {durum.alanHatalari?.ad && <p className="text-sm text-danger">{durum.alanHatalari.ad}</p>}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="slug">Slug (boşsa addan üretilir)</Label>
              <Input id="slug" name="slug" defaultValue={kurum?.slug ?? ""} />
              {durum.alanHatalari?.slug && (
                <p className="text-sm text-danger">{durum.alanHatalari.slug}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tipId">Kurum tipi</Label>
              <Select id="tipId" value={tipId} onChange={(o) => setTipId(o.target.value)}>
                <option value="">Seçin…</option>
                {tipler.map((tip) => (
                  <option key={tip.id} value={tip.id}>
                    {tip.ad}
                  </option>
                ))}
              </Select>
              <input type="hidden" name="tipId" value={tipId} />
              {durum.alanHatalari?.tipId && (
                <p className="text-sm text-danger">{durum.alanHatalari.tipId}</p>
              )}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="webSitesi">Web sitesi</Label>
              <Input
                id="webSitesi"
                name="webSitesi"
                defaultValue={kurum?.webSitesi ?? ""}
                placeholder="https://"
              />
              {durum.alanHatalari?.webSitesi && (
                <p className="text-sm text-danger">{durum.alanHatalari.webSitesi}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              {/* §6 "Yayınevi vitrini": logo duvarındaki sıra. */}
              <Label htmlFor="sira">Vitrin sırası</Label>
              <Input id="sira" name="sira" type="number" min={0} defaultValue={kurum?.sira ?? 0} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="logo">Logo (PNG/JPEG/WEBP, en fazla 2 MB)</Label>
            <div className="flex items-center gap-3">
              {kurum?.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- küçük sabit boyutlu önizleme
                <img
                  src={kurum.logoUrl}
                  alt=""
                  className="size-10 rounded-md border border-border object-contain"
                />
              ) : (
                <span
                  aria-hidden
                  style={kurumRengi(kurum?.slug ?? "yeni")}
                  className="kurum-zemin size-10 rounded-md"
                />
              )}
              <Input id="logo" name="logo" type="file" accept="image/png,image/jpeg,image/webp" />
            </div>
            <p className="text-xs text-text-muted">
              Yüklenen görsel yeniden kodlanır; konum ve EXIF bilgisi silinir.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="aciklamaMd">Açıklama</Label>
            <Textarea id="aciklamaMd" name="aciklamaMd" rows={3} defaultValue={kurum?.aciklamaMd ?? ""} />
          </div>

          <label className="flex items-center gap-2 text-sm text-text">
            <input
              type="checkbox"
              name="aktifMi"
              value="true"
              defaultChecked={kurum?.aktifMi ?? true}
            />
            Aktif
          </label>
        </CardGovde>
      </Card>

      {durum.hata && (
        <p role="alert" className="text-sm text-danger">
          {durum.hata}
        </p>
      )}

      <Button type="submit" disabled={beklemede}>
        {beklemede ? "Kaydediliyor…" : "Kaydet"}
      </Button>
    </form>
  );
}
