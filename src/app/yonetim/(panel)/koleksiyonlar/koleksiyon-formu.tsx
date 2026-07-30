"use client";

import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardGovde } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { BOS_FILTRE, type KoleksiyonFiltresi } from "@/lib/validations/koleksiyon";
import { filtreOnizle, koleksiyonKaydet, type KoleksiyonFormDurumu } from "./actions";

const baslangicDurumu: KoleksiyonFormDurumu = {};

export interface FiltreSecenekleri {
  kurumlar: { id: string; ad: string }[];
  gruplar: { id: string; ad: string }[];
  duzeyler: { id: string; ad: string }[];
  formatlar: { id: string; ad: string }[];
}

export interface KoleksiyonBaslangic {
  id: string;
  ad: string;
  slug: string;
  sira: number;
  aktifMi: boolean;
  ikon: string | null;
  varsayilanGorunum: string;
  menudeMi: boolean;
  anaSayfadaMi: boolean;
  filtre: KoleksiyonFiltresi;
}

const UYGULAMA_SECENEKLERI = [
  { deger: "TURKIYE_GENELI", ad: "Türkiye Geneli" },
  { deger: "KURUMSAL", ad: "Kurumsal" },
];

const ZORLUK_SECENEKLERI = [
  { deger: "KOLAY", ad: "Kolay" },
  { deger: "ORTA", ad: "Orta" },
  { deger: "ZOR", ad: "Zor" },
];

export function KoleksiyonFormu({
  koleksiyon,
  secenekler,
}: {
  koleksiyon?: KoleksiyonBaslangic;
  secenekler: FiltreSecenekleri;
}) {
  const [durum, eylem, beklemede] = useActionState(koleksiyonKaydet, baslangicDurumu);
  const [filtre, setFiltre] = useState<KoleksiyonFiltresi>(koleksiyon?.filtre ?? BOS_FILTRE);

  // §6: "canlı önizleme — bu filtre şu an 47 ilan getiriyor. Önizleme olmadan
  // admin ne tanımladığını göremez."
  const [onizleme, setOnizleme] = useState<{ adet: number; ornekler: string[] } | null>(null);
  const [onizlemeBekliyor, baslatOnizleme] = useTransition();

  const filtreJson = useMemo(() => JSON.stringify(filtre), [filtre]);

  useEffect(() => {
    // Yazarken her tuşta sorgu atmamak için kısa gecikme.
    const zamanlayici = setTimeout(() => {
      baslatOnizleme(async () => {
        const sonuc = await filtreOnizle(filtreJson);
        if (!sonuc.hata) setOnizleme({ adet: sonuc.adet, ornekler: sonuc.ornekler });
      });
    }, 300);
    return () => clearTimeout(zamanlayici);
  }, [filtreJson]);

  function coklu(alan: keyof KoleksiyonFiltresi, deger: string) {
    setFiltre((onceki) => {
      const mevcut = (onceki[alan] as string[]) ?? [];
      const yeni = mevcut.includes(deger) ? mevcut.filter((d) => d !== deger) : [...mevcut, deger];
      return { ...onceki, [alan]: yeni };
    });
  }

  return (
    <form action={eylem} className="flex flex-col gap-4 lg:flex-row lg:items-start">
      <input type="hidden" name="id" value={koleksiyon?.id ?? ""} />
      <input type="hidden" name="filtreJson" value={filtreJson} />

      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <Card>
          <CardGovde className="flex flex-col gap-3 p-4">
            <h2 className="font-baslik text-lg font-semibold text-text">Sekme bilgileri</h2>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ad">Ad (menüde görünen)</Label>
                <Input id="ad" name="ad" defaultValue={koleksiyon?.ad} required />
                {durum.alanHatalari?.ad && (
                  <p className="text-sm text-danger">{durum.alanHatalari.ad}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="slug">Slug (boşsa addan üretilir)</Label>
                <Input id="slug" name="slug" defaultValue={koleksiyon?.slug ?? ""} />
                {durum.alanHatalari?.slug && (
                  <p className="text-sm text-danger">{durum.alanHatalari.slug}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="sira">Menü sırası</Label>
                <Input
                  id="sira"
                  name="sira"
                  type="number"
                  min={0}
                  defaultValue={koleksiyon?.sira ?? 0}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="varsayilanGorunum">Varsayılan görünüm</Label>
                <Select
                  id="varsayilanGorunum"
                  name="varsayilanGorunum"
                  defaultValue={koleksiyon?.varsayilanGorunum ?? "AYLIK"}
                >
                  <option value="AYLIK">Aylık</option>
                  <option value="LISTE">Liste</option>
                  <option value="HAFTALIK">Haftalık</option>
                </Select>
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm text-text">
                <input
                  type="checkbox"
                  name="aktifMi"
                  value="true"
                  defaultChecked={koleksiyon?.aktifMi ?? true}
                />
                Aktif
              </label>
              <label className="flex items-center gap-2 text-sm text-text">
                <input
                  type="checkbox"
                  name="menudeMi"
                  value="true"
                  defaultChecked={koleksiyon?.menudeMi ?? true}
                />
                Üst menüde göster
              </label>
              <label className="flex items-center gap-2 text-sm text-text">
                <input
                  type="checkbox"
                  name="anaSayfadaMi"
                  value="true"
                  defaultChecked={koleksiyon?.anaSayfadaMi ?? false}
                />
                Ana sayfada göster
              </label>
            </div>
          </CardGovde>
        </Card>

        <Card>
          <CardGovde className="flex flex-col gap-4 p-4">
            <div>
              <h2 className="font-baslik text-lg font-semibold text-text">Filtre</h2>
              <p className="text-sm text-text-muted">
                Hiçbir şey seçilmezse tüm ilanlar gelir. Aynı grup içinde birden çok seçim
                &ldquo;veya&rdquo;, farklı gruplar arası &ldquo;ve&rdquo; olarak birleşir.
              </p>
            </div>

            <FiltreGrubu
              baslik="Sınav ailesi (grup)"
              secenekler={secenekler.gruplar.map((g) => ({ deger: g.id, ad: g.ad }))}
              secili={filtre.grupIds}
              onDegis={(deger) => coklu("grupIds", deger)}
            />
            <FiltreGrubu
              baslik="Düzey"
              secenekler={secenekler.duzeyler.map((d) => ({ deger: d.id, ad: d.ad }))}
              secili={filtre.duzeyIds}
              onDegis={(deger) => coklu("duzeyIds", deger)}
            />
            <FiltreGrubu
              baslik="Format"
              secenekler={secenekler.formatlar.map((f) => ({ deger: f.id, ad: f.ad }))}
              secili={filtre.formatIds}
              onDegis={(deger) => coklu("formatIds", deger)}
            />
            <FiltreGrubu
              baslik="Kurum"
              secenekler={secenekler.kurumlar.map((k) => ({ deger: k.id, ad: k.ad }))}
              secili={filtre.kurumIds}
              onDegis={(deger) => coklu("kurumIds", deger)}
            />
            <FiltreGrubu
              baslik="Uygulama tipi"
              secenekler={UYGULAMA_SECENEKLERI}
              secili={filtre.uygulamaTipi}
              onDegis={(deger) => coklu("uygulamaTipi", deger)}
            />
            <FiltreGrubu
              baslik="Zorluk"
              secenekler={ZORLUK_SECENEKLERI}
              secili={filtre.zorluk}
              onDegis={(deger) => coklu("zorluk", deger)}
            />

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="baslikIcerir">Başlık şunu içersin (opsiyonel)</Label>
              <Input
                id="baslikIcerir"
                value={filtre.baslikIcerir ?? ""}
                placeholder="ör. Fen Lis."
                onChange={(olay) =>
                  setFiltre((onceki) => ({
                    ...onceki,
                    baslikIcerir: olay.target.value || undefined,
                  }))
                }
              />
            </div>

            <Button
              type="button"
              varyant="ikincil"
              boyut="sm"
              onClick={() => setFiltre(BOS_FILTRE)}
            >
              Filtreyi temizle
            </Button>
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
      </div>

      {/* §6: canlı önizleme paneli — yapışkan, form doldurulurken hep görünür. */}
      <Card className="w-full shrink-0 lg:sticky lg:top-4 lg:w-72">
        <CardGovde className="flex flex-col gap-3 p-4">
          <h2 className="font-baslik text-lg font-semibold text-text">Canlı önizleme</h2>

          <div className="flex items-baseline gap-2">
            <span className="sayisal text-2xl font-semibold text-text">
              {onizleme ? onizleme.adet : "—"}
            </span>
            <span className="text-sm text-text-muted">
              {onizlemeBekliyor ? "hesaplanıyor…" : "ilan getiriyor"}
            </span>
          </div>

          {onizleme && onizleme.adet === 0 && (
            <Badge varyant="uyari">Bu filtre hiç ilan getirmiyor</Badge>
          )}

          {onizleme && onizleme.ornekler.length > 0 && (
            <div className="flex flex-col gap-1">
              <p className="text-xs text-text-muted">İlk eşleşenler:</p>
              <ul className="flex flex-col gap-1">
                {onizleme.ornekler.map((baslik) => (
                  <li key={baslik} className="truncate text-xs text-text">
                    {baslik}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-xs text-text-muted">Yalnızca yayında olan ilanlar sayılır.</p>
        </CardGovde>
      </Card>
    </form>
  );
}

function FiltreGrubu({
  baslik,
  secenekler,
  secili,
  onDegis,
}: {
  baslik: string;
  secenekler: { deger: string; ad: string }[];
  secili: string[];
  onDegis: (deger: string) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="text-sm font-medium text-text">
        {baslik}
        {secili.length > 0 && <span className="text-text-muted"> · {secili.length} seçili</span>}
      </legend>
      <div className="flex max-h-32 flex-wrap gap-x-4 gap-y-1 overflow-y-auto rounded-sm border border-border p-2">
        {secenekler.map((secenek) => (
          <label key={secenek.deger} className="flex items-center gap-1.5 text-sm text-text">
            <input
              type="checkbox"
              checked={secili.includes(secenek.deger)}
              onChange={() => onDegis(secenek.deger)}
            />
            {secenek.ad}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
