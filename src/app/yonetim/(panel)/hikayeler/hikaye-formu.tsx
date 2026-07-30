"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardGovde } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { hikayeKaydet, type HikayeFormDurumu } from "./actions";

const baslangic: HikayeFormDurumu = {};

export interface HikayeBaslangic {
  id: string;
  baslik: string;
  gorselUrl: string;
  baglanti: string | null;
  sira: number;
  aktifMi: boolean;
}

export function HikayeFormu({ hikaye }: { hikaye?: HikayeBaslangic }) {
  const [durum, eylem, beklemede] = useActionState(hikayeKaydet, baslangic);

  return (
    <form action={eylem} className="flex max-w-2xl flex-col gap-4">
      <input type="hidden" name="id" value={hikaye?.id ?? ""} />

      <Card>
        <CardGovde className="flex flex-col gap-3 p-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="baslik">Başlık</Label>
            <Input id="baslik" name="baslik" defaultValue={hikaye?.baslik} required />
            {durum.alanHatalari?.baslik && (
              <p className="text-sm text-danger">{durum.alanHatalari.baslik}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="gorsel">Görsel (PNG/JPEG/WEBP, en fazla 2 MB, dikey 9:16 önerilir)</Label>
            <div className="flex items-center gap-3">
              {hikaye?.gorselUrl && (
                // eslint-disable-next-line @next/next/no-img-element -- küçük sabit boyutlu önizleme
                <img
                  src={hikaye.gorselUrl}
                  alt=""
                  className="h-16 w-10 rounded-md border border-border object-cover"
                />
              )}
              <Input id="gorsel" name="gorsel" type="file" accept="image/png,image/jpeg,image/webp" />
            </div>
            <p className="text-xs text-text-muted">
              Yüklenen görsel yeniden kodlanır; konum ve EXIF bilgisi silinir.
            </p>
            {durum.alanHatalari?.gorsel && (
              <p className="text-sm text-danger">{durum.alanHatalari.gorsel}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="baglanti">Bağlantı (opsiyonel)</Label>
            <Input
              id="baglanti"
              name="baglanti"
              defaultValue={hikaye?.baglanti ?? ""}
              placeholder="/ilan/ozdebir-tyt-ayt-denemesi-01 ya da https://…"
            />
            <p className="text-xs text-text-muted">
              Hikayeye tıklanınca gidilecek sayfa — site içi göreli yol ya da dış bağlantı.
            </p>
            {durum.alanHatalari?.baglanti && (
              <p className="text-sm text-danger">{durum.alanHatalari.baglanti}</p>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sira">Sıra</Label>
              <Input id="sira" name="sira" type="number" min={0} defaultValue={hikaye?.sira ?? 0} />
            </div>

            <label className="flex items-center gap-2 self-end pb-2 text-sm text-text">
              <input
                type="checkbox"
                name="aktifMi"
                value="true"
                defaultChecked={hikaye?.aktifMi ?? true}
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
