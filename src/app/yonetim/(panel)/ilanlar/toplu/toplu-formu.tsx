"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardGovde } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { topluSeriOlustur, type IlanFormDurumu } from "../actions";
import type { SecenekListeleri } from "../ilan-formu";

const baslangic: IlanFormDurumu = {};

interface Satir {
  anahtar: string;
  sinavTarihi: string;
  sinavBitisTarihi: string;
  sonSiparisTarihi: string;
  cevapAnahtariZamani: string;
}

function bosSatir(): Satir {
  return {
    anahtar: crypto.randomUUID(),
    sinavTarihi: "",
    sinavBitisTarihi: "",
    sonSiparisTarihi: "",
    cevapAnahtariZamani: "",
  };
}

// §4.1: "Admin seriyi bir kez tanımlar, sonra tek ekranda sezonun tarihlerini
// satır satır girer. Kaydet → 10 ilan üretilir. Ortak alanlar bir kez girilir."
export function TopluFormu({ secenekler }: { secenekler: SecenekListeleri }) {
  const [durum, eylem, beklemede] = useActionState(topluSeriOlustur, baslangic);

  const [kurumId, setKurumId] = useState("");
  const [dagiticiKurumId, setDagiticiKurumId] = useState("");
  const [grupId, setGrupId] = useState("");
  const [formatId, setFormatId] = useState("");
  const [satirlar, setSatirlar] = useState<Satir[]>(() => [bosSatir(), bosSatir(), bosSatir()]);

  function guncelle(anahtar: string, alan: keyof Satir, deger: string) {
    setSatirlar((onceki) =>
      onceki.map((s) => (s.anahtar === anahtar ? { ...s, [alan]: deger } : s)),
    );
  }

  const doluSatirlar = satirlar.filter((s) => s.sinavTarihi);

  return (
    <form action={eylem} className="flex max-w-4xl flex-col gap-5">
      <input
        type="hidden"
        name="satirlarJson"
        value={JSON.stringify(
          doluSatirlar.map((s) => ({
            sinavTarihi: s.sinavTarihi,
            sinavBitisTarihi: s.sinavBitisTarihi,
            sonSiparisTarihi: s.sonSiparisTarihi,
            cevapAnahtariZamani: s.cevapAnahtariZamani,
          })),
        )}
      />

      <Card>
        <CardGovde className="flex flex-col gap-3 p-4">
          <h2 className="font-baslik text-lg font-semibold text-text">Ortak alanlar</h2>
          <p className="text-sm text-text-muted">
            Bir kez girilir, tüm satırlara uygulanır. Başlık ön ekine sıra numarası eklenir (ör.
            &quot;Özdebir TYT-AYT Denemesi 01&quot;).
          </p>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="baslikOnEki">Başlık ön eki</Label>
            <Input
              id="baslikOnEki"
              name="baslikOnEki"
              placeholder="Özdebir TYT-AYT Denemesi"
              required
            />
            {durum.alanHatalari?.baslikOnEki && (
              <p className="text-sm text-danger">{durum.alanHatalari.baslikOnEki}</p>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Secim
              ad="kurumId"
              etiket="Kurum"
              deger={kurumId}
              setDeger={setKurumId}
              secenekler={secenekler.kurumlar}
              hata={durum.alanHatalari?.kurumId}
            />
            <Secim
              ad="dagiticiKurumId"
              etiket="Dağıtıcı kurum (opsiyonel)"
              deger={dagiticiKurumId}
              setDeger={setDagiticiKurumId}
              secenekler={secenekler.kurumlar}
              bosEtiket="Yok"
            />
            <Secim
              ad="grupId"
              etiket="Grup"
              deger={grupId}
              setDeger={setGrupId}
              secenekler={secenekler.gruplar}
              hata={durum.alanHatalari?.grupId}
            />
            <Secim
              ad="formatId"
              etiket="Format"
              deger={formatId}
              setDeger={setFormatId}
              secenekler={secenekler.formatlar}
              hata={durum.alanHatalari?.formatId}
            />
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-medium text-text">Düzeyler</legend>
            <div className="flex flex-wrap gap-3">
              {secenekler.duzeyler.map((duzey) => (
                <label key={duzey.id} className="flex items-center gap-1.5 text-sm text-text">
                  <input type="checkbox" name="duzeyIds" value={duzey.id} />
                  {duzey.ad}
                </label>
              ))}
            </div>
            {durum.alanHatalari?.duzeyIds && (
              <p className="text-sm text-danger">{durum.alanHatalari.duzeyIds}</p>
            )}
          </fieldset>

          <div className="grid gap-3 sm:grid-cols-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="uygulamaTipi">Uygulama tipi</Label>
              <Select id="uygulamaTipi" name="uygulamaTipi" defaultValue="TURKIYE_GENELI">
                <option value="TURKIYE_GENELI">Türkiye Geneli</option>
                <option value="KURUMSAL">Kurumsal</option>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="zorluk">Zorluk</Label>
              <Select id="zorluk" name="zorluk" defaultValue="">
                <option value="">Belirtilmedi</option>
                <option value="KOLAY">Kolay</option>
                <option value="ORTA">Orta</option>
                <option value="ZOR">Zor</option>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="saat">Saat</Label>
              <Input id="saat" name="saat" type="time" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="baslangicNo">Başlangıç no</Label>
              <Input id="baslangicNo" name="baslangicNo" type="number" min={1} defaultValue={1} />
            </div>
          </div>
        </CardGovde>
      </Card>

      <Card>
        <CardGovde className="flex flex-col gap-3 p-4">
          <div className="flex items-baseline justify-between">
            <h2 className="font-baslik text-lg font-semibold text-text">Tarihler</h2>
            <span className="sayisal text-sm text-text-muted">
              {doluSatirlar.length} ilan üretilecek
            </span>
          </div>

          <div className="hidden gap-2 text-xs text-text-muted sm:grid sm:grid-cols-[2rem_repeat(4,1fr)_3rem]">
            <span>No</span>
            <span>Sınav tarihi</span>
            <span>Bitiş</span>
            <span>Son sipariş</span>
            <span>Cevap anahtarı</span>
            <span />
          </div>

          {satirlar.map((satir, index) => (
            <div
              key={satir.anahtar}
              className="grid gap-2 sm:grid-cols-[2rem_repeat(4,1fr)_3rem] sm:items-center"
            >
              <span className="sayisal text-sm text-text-muted">
                {String(index + 1).padStart(2, "0")}
              </span>
              <Input
                aria-label={`${index + 1}. satır sınav tarihi`}
                type="date"
                value={satir.sinavTarihi}
                onChange={(o) => guncelle(satir.anahtar, "sinavTarihi", o.target.value)}
              />
              <Input
                aria-label={`${index + 1}. satır bitiş tarihi`}
                type="date"
                value={satir.sinavBitisTarihi}
                onChange={(o) => guncelle(satir.anahtar, "sinavBitisTarihi", o.target.value)}
              />
              <Input
                aria-label={`${index + 1}. satır son sipariş tarihi`}
                type="date"
                value={satir.sonSiparisTarihi}
                onChange={(o) => guncelle(satir.anahtar, "sonSiparisTarihi", o.target.value)}
              />
              <Input
                aria-label={`${index + 1}. satır cevap anahtarı zamanı`}
                type="datetime-local"
                value={satir.cevapAnahtariZamani}
                onChange={(o) => guncelle(satir.anahtar, "cevapAnahtariZamani", o.target.value)}
              />
              <Button
                type="button"
                varyant="tehlike"
                boyut="sm"
                onClick={() =>
                  setSatirlar((onceki) => onceki.filter((s) => s.anahtar !== satir.anahtar))
                }
              >
                Sil
              </Button>
            </div>
          ))}

          <Button
            type="button"
            varyant="ikincil"
            boyut="sm"
            onClick={() => setSatirlar((onceki) => [...onceki, bosSatir()])}
          >
            + Satır ekle
          </Button>
        </CardGovde>
      </Card>

      {durum.hata && (
        <p role="alert" className="text-sm text-danger">
          {durum.hata}
        </p>
      )}

      <p className="text-sm text-text-muted">
        Üretilen ilanlar <strong>taslak</strong> olarak kaydedilir; tek tek gözden geçirip
        yayınlarsınız.
      </p>

      <Button type="submit" disabled={beklemede || doluSatirlar.length === 0}>
        {beklemede ? "Oluşturuluyor…" : `${doluSatirlar.length} ilan oluştur`}
      </Button>
    </form>
  );
}

function Secim({
  ad,
  etiket,
  deger,
  setDeger,
  secenekler,
  hata,
  bosEtiket = "Seçin…",
}: {
  ad: string;
  etiket: string;
  deger: string;
  setDeger: (yeni: string) => void;
  secenekler: { id: string; ad: string }[];
  hata?: string;
  bosEtiket?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={ad}>{etiket}</Label>
      <Select id={ad} value={deger} onChange={(olay) => setDeger(olay.target.value)}>
        <option value="">{bosEtiket}</option>
        {secenekler.map((secenek) => (
          <option key={secenek.id} value={secenek.id}>
            {secenek.ad}
          </option>
        ))}
      </Select>
      <input type="hidden" name={ad} value={deger} />
      {hata && <p className="text-sm text-danger">{hata}</p>}
    </div>
  );
}
