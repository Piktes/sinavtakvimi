"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardGovde } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SOSYAL_PLATFORMLAR, SOSYAL_PLATFORM_ADLARI } from "@/lib/sosyal-platform";
import { sosyalBaglantiKaydet, type SosyalFormDurumu } from "./actions";

const baslangic: SosyalFormDurumu = {};

export interface SosyalBaslangic {
  id: string;
  platform: string;
  url: string;
  sira: number;
  aktifMi: boolean;
}

export function SosyalBaglantiFormu({ baglanti }: { baglanti?: SosyalBaslangic }) {
  const [durum, eylem, beklemede] = useActionState(sosyalBaglantiKaydet, baslangic);
  const [platform, setPlatform] = useState(baglanti?.platform ?? SOSYAL_PLATFORMLAR[0]);

  return (
    <form action={eylem} className="flex max-w-2xl flex-col gap-4">
      <input type="hidden" name="id" value={baglanti?.id ?? ""} />

      <Card>
        <CardGovde className="flex flex-col gap-3 p-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="platform">Platform</Label>
            <Select
              id="platform"
              value={platform}
              onChange={(olay) => setPlatform(olay.target.value)}
              disabled={Boolean(baglanti)}
            >
              {SOSYAL_PLATFORMLAR.map((p) => (
                <option key={p} value={p}>
                  {SOSYAL_PLATFORM_ADLARI[p]}
                </option>
              ))}
            </Select>
            <input type="hidden" name="platform" value={platform} />
            {durum.alanHatalari?.platform && (
              <p className="text-sm text-danger">{durum.alanHatalari.platform}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="url">Bağlantı</Label>
            <Input
              id="url"
              name="url"
              defaultValue={baglanti?.url ?? ""}
              placeholder="https://instagram.com/..."
              required
            />
            {durum.alanHatalari?.url && (
              <p className="text-sm text-danger">{durum.alanHatalari.url}</p>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sira">Sıra</Label>
              <Input
                id="sira"
                name="sira"
                type="number"
                min={0}
                defaultValue={baglanti?.sira ?? 0}
              />
            </div>

            <label className="flex items-center gap-2 self-end pb-2 text-sm text-text">
              <input
                type="checkbox"
                name="aktifMi"
                value="true"
                defaultChecked={baglanti?.aktifMi ?? true}
              />
              Aktif
            </label>
          </div>
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
