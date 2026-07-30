"use client";

import { useActionState, useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardGovde } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { kurumTipiKaydet, kurumTipiSil, type KurumTipiDurumu } from "./actions";

const baslangic: KurumTipiDurumu = {};

export interface TipSatiri {
  id: string;
  ad: string;
  slug: string;
  sira: number;
  aktifMi: boolean;
  kurumSayisi: number;
}

export function TipYonetimi({ tipler }: { tipler: TipSatiri[] }) {
  const [duzenlenen, setDuzenlenen] = useState<TipSatiri | null>(null);
  const [durum, eylem, beklemede] = useActionState(kurumTipiKaydet, baslangic);
  const [silHatasi, setSilHatasi] = useState<string | null>(null);
  const [silBekliyor, baslatSil] = useTransition();

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
      <Card className="min-w-0 flex-1">
        <ul className="divide-y divide-border">
          {tipler.map((tip) => (
            <li key={tip.id} className="flex items-center gap-3 p-3">
              <span className="sayisal w-8 shrink-0 text-sm text-text-muted">{tip.sira}</span>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-text">{tip.ad}</p>
                <p className="text-xs text-text-muted">
                  {tip.slug} · {tip.kurumSayisi} kurum
                </p>
              </div>

              {!tip.aktifMi && <Badge varyant="notr">Pasif</Badge>}

              <Button varyant="hayalet" boyut="sm" onClick={() => setDuzenlenen(tip)}>
                Düzenle
              </Button>

              <Button
                varyant="tehlike"
                boyut="sm"
                disabled={silBekliyor || tip.kurumSayisi > 0}
                title={tip.kurumSayisi > 0 ? "Kullanımdaki tip silinemez" : undefined}
                onClick={() => {
                  if (!window.confirm(`"${tip.ad}" silinsin mi?`)) return;
                  baslatSil(async () => {
                    const sonuc = await kurumTipiSil(tip.id);
                    setSilHatasi(sonuc?.hata ?? null);
                  });
                }}
              >
                Sil
              </Button>
            </li>
          ))}
        </ul>
        {silHatasi && <p className="p-3 text-sm text-danger">{silHatasi}</p>}
      </Card>

      <Card className="w-full shrink-0 lg:w-80">
        <CardGovde className="flex flex-col gap-3 p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-baslik text-lg font-semibold text-text">
              {duzenlenen ? "Düzenle" : "Yeni tip"}
            </h2>
            {duzenlenen && (
              <Button varyant="hayalet" boyut="sm" onClick={() => setDuzenlenen(null)}>
                Vazgeç
              </Button>
            )}
          </div>

          <form key={duzenlenen?.id ?? "yeni"} action={eylem} className="flex flex-col gap-3">
            <input type="hidden" name="id" value={duzenlenen?.id ?? ""} />

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tip-ad">Ad</Label>
              <Input id="tip-ad" name="ad" defaultValue={duzenlenen?.ad ?? ""} required />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="tip-slug">Slug</Label>
                <Input id="tip-slug" name="slug" defaultValue={duzenlenen?.slug ?? ""} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="tip-sira">Sıra</Label>
                <Input
                  id="tip-sira"
                  name="sira"
                  type="number"
                  min={0}
                  defaultValue={duzenlenen?.sira ?? 0}
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-text">
              <input
                type="checkbox"
                name="aktifMi"
                value="true"
                defaultChecked={duzenlenen?.aktifMi ?? true}
              />
              Aktif
            </label>

            {durum.hata && <p className="text-sm text-danger">{durum.hata}</p>}
            {durum.basari && <p className="text-sm text-success">{durum.basari}</p>}

            <Button type="submit" disabled={beklemede}>
              {beklemede ? "Kaydediliyor…" : duzenlenen ? "Güncelle" : "Ekle"}
            </Button>
          </form>
        </CardGovde>
      </Card>
    </div>
  );
}
