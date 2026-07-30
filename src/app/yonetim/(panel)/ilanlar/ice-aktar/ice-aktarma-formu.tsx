"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { AlertTriangle, CheckCircle2, Download, FileWarning } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardGovde } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import {
  dosyayiDogrula,
  onaylananlariAktar,
  type AktarmaSonucu,
  type DogrulamaRaporu,
} from "./actions";
import type { SutunTanimi } from "@/lib/ice-aktarma/ilan-sutunlari";

const bosRapor: DogrulamaRaporu = {};
const bosSonuc: AktarmaSonucu = {};

export function IceAktarmaFormu({ sutunlar }: { sutunlar: SutunTanimi[] }) {
  const [rapor, dogrulaEylemi, dogrulaBekliyor] = useActionState(dosyayiDogrula, bosRapor);
  const [sonuc, aktarEylemi, aktarBekliyor] = useActionState(onaylananlariAktar, bosSonuc);
  const [cakisanlariAtla, setCakisanlariAtla] = useState(true);

  const gecerliSayisi = rapor.gecerli?.length ?? 0;
  const hataliSatirlar = new Set(rapor.hatalar?.map((h) => h.satirNo));
  const cakisanSayisi = rapor.cakisanlar?.length ?? 0;

  if (sonuc.eklenen !== undefined) {
    return (
      <Card>
        <CardGovde className="flex flex-col items-start gap-3 p-5">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={20} strokeWidth={1.75} className="text-success" aria-hidden />
            <p className="text-base font-medium text-text">
              {sonuc.eklenen} ilan taslak olarak eklendi.
            </p>
          </div>
          <p className="text-sm text-text-muted">
            İlanlar listesinden gözden geçirip yayınlayabilirsiniz.
          </p>
          <div className="flex gap-2">
            <Button varyant="birincil" boyut="sm">
              <Link href="/yonetim/ilanlar?yayin=TASLAK">Taslakları gör</Link>
            </Button>
            <Button varyant="ikincil" boyut="sm">
              <Link href="/yonetim/ilanlar/ice-aktar">Yeni dosya yükle</Link>
            </Button>
          </div>
        </CardGovde>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 1. Şablon */}
      <Card>
        <CardGovde className="flex flex-col gap-3 p-4">
          <h2 className="font-baslik text-lg font-semibold text-text">1. Şablonu indirin</h2>
          <p className="text-sm text-text-muted">
            Sütun başlıkları, hangi alanın zorunlu olduğu ve panelinizdeki gerçek kayıtlardan
            üretilmiş örnek bir satır içerir. Excel&apos;de açıp doldurun, CSV olarak kaydedin.
          </p>
          <div>
            <Button varyant="ikincil" boyut="sm">
              <a href="/yonetim/ilanlar/ice-aktar/sablon" download>
                <Download size={16} strokeWidth={1.75} aria-hidden />
                Örnek şablonu indir
              </a>
            </Button>
          </div>

          <details className="text-sm">
            <summary className="cursor-pointer text-text-muted">Sütun listesi</summary>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-text-muted">
                    <th className="py-1 pr-3 font-medium">Sütun</th>
                    <th className="py-1 pr-3 font-medium">Zorunlu</th>
                    <th className="py-1 pr-3 font-medium">Açıklama</th>
                    <th className="py-1 font-medium">Örnek</th>
                  </tr>
                </thead>
                <tbody>
                  {sutunlar.map((sutun) => (
                    <tr key={sutun.anahtar} className="border-b border-border">
                      <td className="py-1 pr-3 font-mono text-text">{sutun.anahtar}</td>
                      <td className="py-1 pr-3">
                        {sutun.zorunlu ? (
                          <Badge varyant="uyari">Zorunlu</Badge>
                        ) : (
                          <span className="text-text-faint">—</span>
                        )}
                      </td>
                      <td className="py-1 pr-3 text-text-muted">
                        {sutun.aciklama}
                        {sutun.izinliDegerler && (
                          <span className="text-text-faint">
                            {" "}
                            (izinli: {sutun.izinliDegerler.join(" / ")})
                          </span>
                        )}
                      </td>
                      <td className="sayisal py-1 text-text-muted">{sutun.ornek || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </CardGovde>
      </Card>

      {/* 2. Yükleme */}
      <Card>
        <CardGovde className="flex flex-col gap-3 p-4">
          <h2 className="font-baslik text-lg font-semibold text-text">2. Dosyayı yükleyin</h2>
          <form action={dogrulaEylemi} className="flex flex-wrap items-end gap-3">
            <div className="flex min-w-64 flex-1 flex-col gap-1.5">
              <Label htmlFor="dosya">CSV dosyası</Label>
              <Input id="dosya" name="dosya" type="file" accept=".csv,text/csv" required />
            </div>
            <Button type="submit" disabled={dogrulaBekliyor}>
              {dogrulaBekliyor ? "Kontrol ediliyor…" : "Kontrol et"}
            </Button>
          </form>
          <p className="text-xs text-text-muted">
            Bu adımda hiçbir kayıt oluşturulmaz — önce rapor gösterilir.
          </p>

          {rapor.hata && (
            <div role="alert" className="flex flex-col gap-1 rounded-md bg-danger-bg px-3 py-2">
              <p className="text-sm text-danger">{rapor.hata}</p>
              {rapor.eksikSutunlar && (
                <p className="text-sm text-danger">
                  Eksik sütunlar: <span className="font-mono">{rapor.eksikSutunlar.join(", ")}</span>
                </p>
              )}
            </div>
          )}
        </CardGovde>
      </Card>

      {/* 3. Rapor */}
      {rapor.toplamSatir !== undefined && (
        <Card>
          <CardGovde className="flex flex-col gap-4 p-4">
            <h2 className="font-baslik text-lg font-semibold text-text">3. Doğrulama raporu</h2>

            <div className="grid gap-3 sm:grid-cols-3">
              <Ozet etiket="Okunan satır" deger={rapor.toplamSatir} />
              <Ozet etiket="Geçerli" deger={gecerliSayisi} olumlu />
              <Ozet etiket="Hatalı satır" deger={hataliSatirlar.size} olumsuz={hataliSatirlar.size > 0} />
            </div>

            {rapor.hatalar && rapor.hatalar.length > 0 && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <FileWarning size={16} strokeWidth={1.75} className="text-danger" aria-hidden />
                  <h3 className="text-sm font-medium text-text">
                    Düzeltilmesi gerekenler ({rapor.hatalar.length})
                  </h3>
                </div>
                <div className="max-h-80 overflow-y-auto rounded-md border border-border">
                  <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 bg-bg-subtle">
                      <tr className="text-text-muted">
                        <th className="px-3 py-2 font-medium">Satır</th>
                        <th className="px-3 py-2 font-medium">Sütun</th>
                        <th className="px-3 py-2 font-medium">Girilen</th>
                        <th className="px-3 py-2 font-medium">Sorun</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rapor.hatalar.map((hata, index) => (
                        <tr key={`${hata.satirNo}-${hata.sutun}-${index}`} className="border-t border-border">
                          <td className="sayisal px-3 py-2 text-text-muted">{hata.satirNo}</td>
                          <td className="px-3 py-2 font-mono text-xs text-text">{hata.sutun}</td>
                          <td className="px-3 py-2 text-text-muted">
                            {hata.deger || <span className="text-text-faint">(boş)</span>}
                          </td>
                          <td className="px-3 py-2 text-danger">{hata.mesaj}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-text-muted">
                  Satır numaraları Excel&apos;de gördüğünüz numaralarla aynıdır. Hatalı satırlar
                  aktarılmaz; düzeltip dosyayı yeniden yükleyebilirsiniz.
                </p>
              </div>
            )}

            {cakisanSayisi > 0 && (
              <div className="flex flex-col gap-2 rounded-md bg-warning-bg px-3 py-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={16} strokeWidth={1.75} className="text-warning" aria-hidden />
                  <p className="text-sm font-medium text-warning">
                    {cakisanSayisi} satır zaten kayıtlı görünüyor
                  </p>
                </div>
                <ul className="text-sm text-warning">
                  {rapor.cakisanlar!.slice(0, 5).map((cakisan) => (
                    <li key={cakisan.satirNo}>
                      Satır {cakisan.satirNo}: {cakisan.baslik}
                    </li>
                  ))}
                  {cakisanSayisi > 5 && <li>…ve {cakisanSayisi - 5} tane daha</li>}
                </ul>
                <label className="flex items-center gap-2 text-sm text-warning">
                  <input
                    type="checkbox"
                    checked={cakisanlariAtla}
                    onChange={(olay) => setCakisanlariAtla(olay.target.checked)}
                  />
                  Bunları atla (işaret kaldırılırsa kopya kayıt olarak eklenir)
                </label>
              </div>
            )}

            {gecerliSayisi > 0 ? (
              <form action={aktarEylemi} className="flex flex-col gap-2">
                <input type="hidden" name="gecerliJson" value={JSON.stringify(rapor.gecerli)} />
                <input
                  type="hidden"
                  name="cakisanlariAtla"
                  value={cakisanlariAtla ? "true" : "false"}
                />
                <p className="text-sm text-text-muted">
                  Aktarılan ilanlar <strong>taslak</strong> olarak kaydedilir; siz yayınlayana
                  kadar sitede görünmez.
                </p>
                {sonuc.hata && (
                  <p role="alert" className="text-sm text-danger">
                    {sonuc.hata}
                  </p>
                )}
                <div>
                  <Button type="submit" disabled={aktarBekliyor}>
                    {aktarBekliyor
                      ? "Aktarılıyor…"
                      : `${gecerliSayisi} geçerli satırı taslak olarak ekle`}
                  </Button>
                </div>
              </form>
            ) : (
              <p className="text-sm text-text-muted">
                Aktarılabilecek geçerli satır yok. Yukarıdaki hataları düzeltip dosyayı yeniden
                yükleyin.
              </p>
            )}
          </CardGovde>
        </Card>
      )}
    </div>
  );
}

function Ozet({
  etiket,
  deger,
  olumlu = false,
  olumsuz = false,
}: {
  etiket: string;
  deger: number;
  olumlu?: boolean;
  olumsuz?: boolean;
}) {
  return (
    <div className="rounded-md border border-border p-3">
      <p className="text-sm text-text-muted">{etiket}</p>
      <p
        className={
          olumsuz
            ? "sayisal text-2xl font-semibold text-danger"
            : olumlu
              ? "sayisal text-2xl font-semibold text-success"
              : "sayisal text-2xl font-semibold text-text"
        }
      >
        {deger}
      </p>
    </div>
  );
}
