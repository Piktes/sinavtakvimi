"use client";

import { useActionState, useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardGovde } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { takvimNotuKaydet, takvimNotuSil, type TakvimNotuDurumu } from "./actions";

const baslangic: TakvimNotuDurumu = {};

export interface NotSatiri {
  id: string;
  ad: string;
  baslangic: string;
  bitis: string;
  tip: string;
  aciklama: string | null;
  aktifMi: boolean;
  gosterim: string;
}

const TIPLER = [
  { deger: "TATIL", ad: "Resmî tatil" },
  { deger: "BAYRAM", ad: "Bayram" },
  { deger: "SINAV_YOK", ad: "Sınav yok" },
  { deger: "TAHMINI", ad: "Tahmini tarih" },
];

export function NotYonetimi({ notlar }: { notlar: NotSatiri[] }) {
  const [duzenlenen, setDuzenlenen] = useState<NotSatiri | null>(null);
  const [durum, eylem, beklemede] = useActionState(takvimNotuKaydet, baslangic);
  const [silBekliyor, baslatSil] = useTransition();

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
      <Card className="min-w-0 flex-1">
        <ul className="divide-y divide-border">
          {notlar.length === 0 && (
            <li className="p-3 text-sm text-text-muted">Henüz takvim notu yok.</li>
          )}
          {notlar.map((not) => (
            <li key={not.id} className="flex items-center gap-3 p-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-text">{not.ad}</p>
                <p className="sayisal text-xs text-text-muted">{not.gosterim}</p>
              </div>

              <Badge varyant="notr">
                {TIPLER.find((t) => t.deger === not.tip)?.ad ?? not.tip}
              </Badge>
              {!not.aktifMi && <Badge varyant="notr">Pasif</Badge>}

              <Button varyant="hayalet" boyut="sm" onClick={() => setDuzenlenen(not)}>
                Düzenle
              </Button>

              <Button
                varyant="tehlike"
                boyut="sm"
                disabled={silBekliyor}
                onClick={() => {
                  if (!window.confirm(`"${not.ad}" silinsin mi?`)) return;
                  baslatSil(async () => {
                    await takvimNotuSil(not.id);
                  });
                }}
              >
                Sil
              </Button>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="w-full shrink-0 lg:w-80">
        <CardGovde className="flex flex-col gap-3 p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-baslik text-lg font-semibold text-text">
              {duzenlenen ? "Düzenle" : "Yeni not"}
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
              <Label htmlFor="not-ad">Ad</Label>
              <Input
                id="not-ad"
                name="ad"
                defaultValue={duzenlenen?.ad ?? ""}
                placeholder="Yarıyıl tatili"
                required
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="not-baslangic">Başlangıç</Label>
                <Input
                  id="not-baslangic"
                  name="baslangic"
                  type="date"
                  defaultValue={duzenlenen?.baslangic ?? ""}
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="not-bitis">Bitiş</Label>
                <Input
                  id="not-bitis"
                  name="bitis"
                  type="date"
                  defaultValue={duzenlenen?.bitis ?? ""}
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="not-tip">Tip</Label>
              <Select id="not-tip" name="tip" defaultValue={duzenlenen?.tip ?? "TATIL"}>
                {TIPLER.map((tip) => (
                  <option key={tip.deger} value={tip.deger}>
                    {tip.ad}
                  </option>
                ))}
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="not-aciklama">Açıklama</Label>
              <Textarea
                id="not-aciklama"
                name="aciklama"
                rows={2}
                defaultValue={duzenlenen?.aciklama ?? ""}
              />
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
