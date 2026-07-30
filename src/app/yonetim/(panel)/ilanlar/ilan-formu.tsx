"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardGovde } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ilanKaydet, type IlanFormDurumu } from "./actions";

const baslangic: IlanFormDurumu = {};

export interface SecenekListeleri {
  kurumlar: { id: string; ad: string }[];
  gruplar: { id: string; ad: string }[];
  formatlar: { id: string; ad: string }[];
  duzeyler: { id: string; ad: string }[];
}

export interface IlanBaslangicVerisi {
  id: string;
  baslik: string;
  slug: string;
  seriNo: number | null;
  kurumId: string;
  dagiticiKurumId: string | null;
  grupId: string;
  formatId: string;
  duzeyIds: string[];
  sinavTarihi: string;
  sinavBitisTarihi: string | null;
  saat: string | null;
  sonSiparisTarihi: string | null;
  cevapAnahtariZamani: string | null;
  uygulamaTipi: string;
  zorluk: string | null;
  aciklamaMd: string | null;
  afisUrl: string | null;
  detayUrl: string | null;
  sezon: string;
  oneCikar: boolean;
  yayinDurumu: string;
  oturumlar: {
    ad: string;
    saat: string | null;
    sureDk: number | null;
    soruSayisi: number | null;
  }[];
}

interface OturumSatiri {
  anahtar: string;
  ad: string;
  saat: string;
  sureDk: string;
  soruSayisi: string;
}

export function IlanFormu({
  ilan,
  secenekler,
}: {
  ilan?: IlanBaslangicVerisi;
  secenekler: SecenekListeleri;
}) {
  const [durum, eylem, beklemede] = useActionState(ilanKaydet, baslangic);

  // Dinamik <option> listesi olan select'lerde controlled değer + gizli input:
  // sunucudan doğrulama hatası dönünce seçim kaybolmasın.
  const [kurumId, setKurumId] = useState(ilan?.kurumId ?? "");
  const [dagiticiKurumId, setDagiticiKurumId] = useState(ilan?.dagiticiKurumId ?? "");
  const [grupId, setGrupId] = useState(ilan?.grupId ?? "");
  const [formatId, setFormatId] = useState(ilan?.formatId ?? "");

  // §2: Oturum bölümü varsayılan KAPALI — çoğu ilanda boş.
  const [oturumlarAcik, setOturumlarAcik] = useState((ilan?.oturumlar.length ?? 0) > 0);
  const [oturumlar, setOturumlar] = useState<OturumSatiri[]>(
    () =>
      ilan?.oturumlar.map((o, index) => ({
        anahtar: `mevcut-${index}`,
        ad: o.ad,
        saat: o.saat ?? "",
        sureDk: o.sureDk?.toString() ?? "",
        soruSayisi: o.soruSayisi?.toString() ?? "",
      })) ?? [],
  );

  function oturumGuncelle(anahtar: string, alan: keyof OturumSatiri, deger: string) {
    setOturumlar((onceki) =>
      onceki.map((o) => (o.anahtar === anahtar ? { ...o, [alan]: deger } : o)),
    );
  }

  return (
    <form action={eylem} className="flex max-w-3xl flex-col gap-5">
      <input type="hidden" name="id" value={ilan?.id ?? ""} />
      <input
        type="hidden"
        name="oturumlarJson"
        value={JSON.stringify(
          oturumlarAcik
            ? oturumlar.map((o) => ({
                ad: o.ad,
                saat: o.saat,
                sureDk: o.sureDk,
                soruSayisi: o.soruSayisi,
              }))
            : [],
        )}
      />

      <Bolum baslik="Temel">
        <Alan ad="baslik" etiket="Başlık" hata={durum.alanHatalari?.baslik}>
          <Input id="baslik" name="baslik" defaultValue={ilan?.baslik} required />
        </Alan>

        <div className="grid gap-3 sm:grid-cols-2">
          <Alan ad="slug" etiket="Slug (boş bırakılırsa üretilir)" hata={durum.alanHatalari?.slug}>
            <Input id="slug" name="slug" defaultValue={ilan?.slug ?? ""} />
          </Alan>
          <Alan ad="seriNo" etiket="Seri no" hata={durum.alanHatalari?.seriNo}>
            <Input id="seriNo" name="seriNo" type="number" min={1} defaultValue={ilan?.seriNo ?? ""} />
          </Alan>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <SecimAlani
            ad="kurumId"
            etiket="Kurum"
            deger={kurumId}
            setDeger={setKurumId}
            secenekler={secenekler.kurumlar}
            hata={durum.alanHatalari?.kurumId}
          />
          <SecimAlani
            ad="dagiticiKurumId"
            etiket="Dağıtıcı kurum (opsiyonel)"
            deger={dagiticiKurumId}
            setDeger={setDagiticiKurumId}
            secenekler={secenekler.kurumlar}
            bosEtiket="Yok"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <SecimAlani
            ad="grupId"
            etiket="Grup"
            deger={grupId}
            setDeger={setGrupId}
            secenekler={secenekler.gruplar}
            hata={durum.alanHatalari?.grupId}
          />
          <SecimAlani
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
                <input
                  type="checkbox"
                  name="duzeyIds"
                  value={duzey.id}
                  defaultChecked={ilan?.duzeyIds.includes(duzey.id) ?? false}
                />
                {duzey.ad}
              </label>
            ))}
          </div>
          {durum.alanHatalari?.duzeyIds && (
            <p className="text-sm text-danger">{durum.alanHatalari.duzeyIds}</p>
          )}
        </fieldset>
      </Bolum>

      <Bolum baslik="Tarihler">
        <div className="grid gap-3 sm:grid-cols-2">
          <Alan ad="sinavTarihi" etiket="Sınav tarihi" hata={durum.alanHatalari?.sinavTarihi}>
            <Input
              id="sinavTarihi"
              name="sinavTarihi"
              type="date"
              defaultValue={ilan?.sinavTarihi}
              required
            />
          </Alan>
          <Alan
            ad="sinavBitisTarihi"
            etiket="Bitiş tarihi (aralıklı sınav)"
            hata={durum.alanHatalari?.sinavBitisTarihi}
          >
            <Input
              id="sinavBitisTarihi"
              name="sinavBitisTarihi"
              type="date"
              defaultValue={ilan?.sinavBitisTarihi ?? ""}
            />
          </Alan>
          <Alan ad="saat" etiket="Saat" hata={durum.alanHatalari?.saat}>
            <Input id="saat" name="saat" type="time" defaultValue={ilan?.saat ?? ""} />
          </Alan>
          <Alan
            ad="sonSiparisTarihi"
            etiket="Son sipariş tarihi"
            hata={durum.alanHatalari?.sonSiparisTarihi}
          >
            <Input
              id="sonSiparisTarihi"
              name="sonSiparisTarihi"
              type="date"
              defaultValue={ilan?.sonSiparisTarihi ?? ""}
            />
          </Alan>
          <Alan
            ad="cevapAnahtariZamani"
            etiket="Cevap anahtarı zamanı"
            hata={durum.alanHatalari?.cevapAnahtariZamani}
          >
            <Input
              id="cevapAnahtariZamani"
              name="cevapAnahtariZamani"
              type="datetime-local"
              defaultValue={ilan?.cevapAnahtariZamani ?? ""}
            />
          </Alan>
          <Alan ad="sezon" etiket="Sezon (boşsa sınav tarihinden türetilir)">
            <Input id="sezon" name="sezon" defaultValue={ilan?.sezon ?? ""} placeholder="2026-2027" />
          </Alan>
        </div>
      </Bolum>

      {/* §6: "Oturum bölümü varsayılan kapalı." */}
      <Card>
        <CardGovde className="flex flex-col gap-3 p-4">
          <label className="flex items-center gap-2 text-sm font-medium text-text">
            <input
              type="checkbox"
              checked={oturumlarAcik}
              onChange={(olay) => setOturumlarAcik(olay.target.checked)}
            />
            Oturumlar (TYT/AYT gibi)
          </label>

          {oturumlarAcik && (
            <>
              {oturumlar.map((oturum) => (
                <div key={oturum.anahtar} className="grid gap-2 sm:grid-cols-5">
                  <Input
                    aria-label="Oturum adı"
                    placeholder="Ad (TYT)"
                    value={oturum.ad}
                    onChange={(o) => oturumGuncelle(oturum.anahtar, "ad", o.target.value)}
                    className="sm:col-span-2"
                  />
                  <Input
                    aria-label="Oturum saati"
                    type="time"
                    value={oturum.saat}
                    onChange={(o) => oturumGuncelle(oturum.anahtar, "saat", o.target.value)}
                  />
                  <Input
                    aria-label="Süre (dakika)"
                    type="number"
                    min={1}
                    placeholder="Süre dk"
                    value={oturum.sureDk}
                    onChange={(o) => oturumGuncelle(oturum.anahtar, "sureDk", o.target.value)}
                  />
                  <div className="flex gap-2">
                    <Input
                      aria-label="Soru sayısı"
                      type="number"
                      min={1}
                      placeholder="Soru"
                      value={oturum.soruSayisi}
                      onChange={(o) =>
                        oturumGuncelle(oturum.anahtar, "soruSayisi", o.target.value)
                      }
                    />
                    <Button
                      type="button"
                      varyant="tehlike"
                      boyut="sm"
                      onClick={() =>
                        setOturumlar((onceki) =>
                          onceki.filter((o) => o.anahtar !== oturum.anahtar),
                        )
                      }
                    >
                      Sil
                    </Button>
                  </div>
                </div>
              ))}

              <Button
                type="button"
                varyant="ikincil"
                boyut="sm"
                onClick={() =>
                  setOturumlar((onceki) => [
                    ...onceki,
                    {
                      anahtar: crypto.randomUUID(),
                      ad: "",
                      saat: "",
                      sureDk: "",
                      soruSayisi: "",
                    },
                  ])
                }
              >
                Oturum ekle
              </Button>
            </>
          )}
        </CardGovde>
      </Card>

      <Bolum baslik="Sınıflandırma ve yayın">
        <div className="grid gap-3 sm:grid-cols-2">
          <Alan ad="uygulamaTipi" etiket="Uygulama tipi" hata={durum.alanHatalari?.uygulamaTipi}>
            <Select
              id="uygulamaTipi"
              name="uygulamaTipi"
              defaultValue={ilan?.uygulamaTipi ?? "TURKIYE_GENELI"}
            >
              <option value="TURKIYE_GENELI">Türkiye Geneli</option>
              <option value="KURUMSAL">Kurumsal</option>
            </Select>
          </Alan>

          <Alan ad="zorluk" etiket="Zorluk">
            <Select id="zorluk" name="zorluk" defaultValue={ilan?.zorluk ?? ""}>
              <option value="">Belirtilmedi</option>
              <option value="KOLAY">Kolay</option>
              <option value="ORTA">Orta</option>
              <option value="ZOR">Zor</option>
            </Select>
          </Alan>

          <Alan ad="yayinDurumu" etiket="Yayın durumu" hata={durum.alanHatalari?.yayinDurumu}>
            <Select id="yayinDurumu" name="yayinDurumu" defaultValue={ilan?.yayinDurumu ?? "TASLAK"}>
              <option value="TASLAK">Taslak</option>
              <option value="YAYINDA">Yayında</option>
              <option value="ARSIV">Arşiv</option>
            </Select>
          </Alan>

          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm text-text">
              <input
                type="checkbox"
                name="oneCikar"
                value="true"
                defaultChecked={ilan?.oneCikar ?? false}
              />
              Öne çıkar
            </label>
          </div>
        </div>

        <Alan ad="detayUrl" etiket="Yayınevi sayfası (URL)" hata={durum.alanHatalari?.detayUrl}>
          <Input id="detayUrl" name="detayUrl" defaultValue={ilan?.detayUrl ?? ""} placeholder="https://" />
        </Alan>

        <Alan ad="afisUrl" etiket="Afiş görseli (URL)" hata={durum.alanHatalari?.afisUrl}>
          <Input id="afisUrl" name="afisUrl" defaultValue={ilan?.afisUrl ?? ""} placeholder="https://" />
        </Alan>

        <Alan ad="aciklamaMd" etiket="Açıklama">
          <Textarea id="aciklamaMd" name="aciklamaMd" rows={4} defaultValue={ilan?.aciklamaMd ?? ""} />
        </Alan>
      </Bolum>

      {durum.hata && (
        <p role="alert" className="text-sm text-danger">
          {durum.hata}
        </p>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={beklemede}>
          {beklemede ? "Kaydediliyor…" : "Kaydet"}
        </Button>
      </div>
    </form>
  );
}

function Bolum({ baslik, children }: { baslik: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardGovde className="flex flex-col gap-3 p-4">
        <h2 className="font-baslik text-lg font-semibold text-text">{baslik}</h2>
        {children}
      </CardGovde>
    </Card>
  );
}

function Alan({
  ad,
  etiket,
  hata,
  children,
}: {
  ad: string;
  etiket: string;
  hata?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={ad}>{etiket}</Label>
      {children}
      {/* §7 erişilebilirlik: hata alanla ilişkili. */}
      {hata && (
        <p id={`${ad}-hata`} className="text-sm text-danger">
          {hata}
        </p>
      )}
    </div>
  );
}

function SecimAlani({
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
      {/* `name` gizli input'ta: dinamik option listesi olan controlled
          select'lerde DOM senkronizasyonu kayabiliyor. */}
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
