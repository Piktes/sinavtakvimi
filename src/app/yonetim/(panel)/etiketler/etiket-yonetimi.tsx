"use client";

import { useActionState, useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardGovde } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import { etiketKaydet, etiketSil, type EtiketDurumu } from "./actions";

const baslangic: EtiketDurumu = {};

export interface EtiketSatiri {
  id: string;
  tip: string;
  ad: string;
  slug: string;
  kisaAd: string | null;
  sira: number;
  aktifMi: boolean;
  kullanim: number;
}

const SEKMELER = [
  { tip: "GRUP", ad: "Gruplar", aciklama: "Üst menü ve sınıflandırma (YKS, LGS, KPSS…)" },
  { tip: "DUZEY", ad: "Düzeyler", aciklama: "Kullanıcının kalıcı düzey seçimi (11. Sınıf…)" },
  { tip: "FORMAT", ad: "Formatlar", aciklama: "İçerik tipi (TYT, AYT, Branş…)" },
] as const;

// §6: "GRUP/DÜZEY/FORMAT tek ekranda, sekmeyle ayrılmış." Üçü de aynı tabloda
// (Etiket.tip) olduğu için tek bileşen üçünü de yönetir.
export function EtiketYonetimi({ etiketler }: { etiketler: EtiketSatiri[] }) {
  const [aktifTip, setAktifTip] = useState<string>("GRUP");
  const [duzenlenen, setDuzenlenen] = useState<EtiketSatiri | null>(null);
  const [durum, eylem, beklemede] = useActionState(etiketKaydet, baslangic);
  const [silHatasi, setSilHatasi] = useState<string | null>(null);
  const [silBekliyor, baslatSil] = useTransition();

  const gosterilecek = etiketler.filter((e) => e.tip === aktifTip);
  const aktifSekme = SEKMELER.find((s) => s.tip === aktifTip)!;

  return (
    <div className="flex flex-col gap-4">
      <div role="tablist" aria-label="Etiket tipleri" className="flex gap-1">
        {SEKMELER.map((sekme) => (
          <button
            key={sekme.tip}
            type="button"
            role="tab"
            aria-selected={aktifTip === sekme.tip}
            onClick={() => {
              setAktifTip(sekme.tip);
              setDuzenlenen(null);
            }}
            className={cn(
              "rounded-sm px-3 py-2 text-sm transition-colors",
              aktifTip === sekme.tip
                ? "bg-bg-subtle font-medium text-text"
                : "text-text-muted hover:bg-surface-hover",
            )}
          >
            {sekme.ad}
            <span className="sayisal ml-1.5 text-xs text-text-faint">
              {etiketler.filter((e) => e.tip === sekme.tip).length}
            </span>
          </button>
        ))}
      </div>

      <p className="text-sm text-text-muted">{aktifSekme.aciklama}</p>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <Card className="min-w-0 flex-1">
          <ul className="divide-y divide-border">
            {gosterilecek.length === 0 && (
              <li className="p-3 text-sm text-text-muted">Bu tipte etiket yok.</li>
            )}
            {gosterilecek.map((etiket) => (
              <li key={etiket.id} className="flex items-center gap-3 p-3">
                <span className="sayisal w-8 shrink-0 text-sm text-text-muted">{etiket.sira}</span>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-text">{etiket.ad}</p>
                  <p className="truncate text-xs text-text-muted">
                    {etiket.slug} · {etiket.kullanim} ilanda kullanılıyor
                  </p>
                </div>

                {!etiket.aktifMi && <Badge varyant="notr">Pasif</Badge>}

                <Button varyant="hayalet" boyut="sm" onClick={() => setDuzenlenen(etiket)}>
                  Düzenle
                </Button>

                <Button
                  varyant="tehlike"
                  boyut="sm"
                  disabled={silBekliyor || etiket.kullanim > 0}
                  title={etiket.kullanim > 0 ? "Kullanımdaki etiket silinemez" : undefined}
                  onClick={() => {
                    if (!window.confirm(`"${etiket.ad}" silinsin mi?`)) return;
                    baslatSil(async () => {
                      const sonuc = await etiketSil(etiket.id);
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
                {duzenlenen ? "Düzenle" : "Yeni etiket"}
              </h2>
              {duzenlenen && (
                <Button varyant="hayalet" boyut="sm" onClick={() => setDuzenlenen(null)}>
                  Vazgeç
                </Button>
              )}
            </div>

            {/* key: düzenlenen değişince form alanları sıfırlansın. */}
            <form key={duzenlenen?.id ?? `yeni-${aktifTip}`} action={eylem} className="flex flex-col gap-3">
              <input type="hidden" name="id" value={duzenlenen?.id ?? ""} />
              <input type="hidden" name="tip" value={duzenlenen?.tip ?? aktifTip} />

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="etiket-ad">Ad</Label>
                <Input id="etiket-ad" name="ad" defaultValue={duzenlenen?.ad ?? ""} required />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="etiket-slug">Slug (boşsa addan üretilir)</Label>
                <Input id="etiket-slug" name="slug" defaultValue={duzenlenen?.slug ?? ""} />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="etiket-kisaAd">Kısa ad</Label>
                  <Input
                    id="etiket-kisaAd"
                    name="kisaAd"
                    defaultValue={duzenlenen?.kisaAd ?? ""}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="etiket-sira">Sıra</Label>
                  <Input
                    id="etiket-sira"
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
    </div>
  );
}
