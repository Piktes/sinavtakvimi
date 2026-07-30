"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  duzeyiKaydet,
  sifreDegistir,
  type HesapDurumu,
} from "@/app/(genel)/hesabim/hesabim-actions";

const baslangic: HesapDurumu = {};

export function DuzeyFormu({
  duzeyler,
  secili,
}: {
  duzeyler: { id: string; ad: string }[];
  secili: string | null;
}) {
  const [durum, eylem, beklemede] = useActionState(duzeyiKaydet, baslangic);

  return (
    <form action={eylem} className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <Label htmlFor="duzeyId">Sınıf / düzey</Label>
        <Select id="duzeyId" name="duzeyId" defaultValue={secili ?? ""}>
          <option value="">Belirtmek istemiyorum</option>
          {duzeyler.map((duzey) => (
            <option key={duzey.id} value={duzey.id}>
              {duzey.ad}
            </option>
          ))}
        </Select>
        <p className="text-xs text-text-muted">
          Takvim ve listeler açıldığında bu düzey öntanımlı filtre olarak uygulanır.
        </p>
      </div>

      {durum.hata && <p className="text-sm text-danger">{durum.hata}</p>}
      {durum.bilgi && <p className="text-sm text-success">{durum.bilgi}</p>}

      <Button
        type="submit"
        varyant="ikincil"
        boyut="sm"
        disabled={beklemede}
        className="self-start"
      >
        {beklemede ? "Kaydediliyor…" : "Kaydet"}
      </Button>
    </form>
  );
}

export function SifreFormu() {
  const [durum, eylem, beklemede] = useActionState(sifreDegistir, baslangic);

  return (
    <form action={eylem} className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <Label htmlFor="mevcutSifre">Mevcut şifre</Label>
        <Input
          id="mevcutSifre"
          name="mevcutSifre"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="yeniSifre">Yeni şifre</Label>
        <Input
          id="yeniSifre"
          name="yeniSifre"
          type="password"
          autoComplete="new-password"
          required
        />
        <p className="text-xs text-text-muted">
          En az 8 karakter, bir büyük ve bir küçük harf, bir rakam.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="yeniSifreTekrar">Yeni şifre (tekrar)</Label>
        <Input
          id="yeniSifreTekrar"
          name="yeniSifreTekrar"
          type="password"
          autoComplete="new-password"
          required
        />
      </div>

      <p className="text-xs text-text-muted">
        Şifre değişince tüm cihazlardaki oturumlar kapanır; yeniden giriş yapmanız gerekir.
      </p>

      {durum.hata && (
        <p role="alert" className="text-sm text-danger">
          {durum.hata}
        </p>
      )}

      <Button
        type="submit"
        varyant="ikincil"
        boyut="sm"
        disabled={beklemede}
        className="self-start"
      >
        {beklemede ? "Değiştiriliyor…" : "Şifreyi değiştir"}
      </Button>
    </form>
  );
}
