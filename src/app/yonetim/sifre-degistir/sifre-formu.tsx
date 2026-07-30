"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { sifreDegistir, type SifreDurumu } from "./actions";

const baslangic: SifreDurumu = {};

export function SifreFormu() {
  const [durum, eylem, beklemede] = useActionState(sifreDegistir, baslangic);

  return (
    <form action={eylem} className="flex flex-col gap-4">
      <Alan
        ad="mevcutSifre"
        etiket="Mevcut şifre"
        otomatikTamamla="current-password"
        hata={durum.alanHatalari?.mevcutSifre}
      />
      <Alan
        ad="yeniSifre"
        etiket="Yeni şifre"
        otomatikTamamla="new-password"
        hata={durum.alanHatalari?.yeniSifre}
      />
      <Alan
        ad="yeniSifreTekrar"
        etiket="Yeni şifre (tekrar)"
        otomatikTamamla="new-password"
        hata={durum.alanHatalari?.yeniSifreTekrar}
      />

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

function Alan({
  ad,
  etiket,
  otomatikTamamla,
  hata,
}: {
  ad: string;
  etiket: string;
  otomatikTamamla: string;
  hata?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={ad}>{etiket}</Label>
      <Input
        id={ad}
        name={ad}
        type="password"
        autoComplete={otomatikTamamla}
        required
        aria-invalid={hata ? true : undefined}
        aria-describedby={hata ? `${ad}-hata` : undefined}
      />
      {/* §7 erişilebilirlik: form hataları alanla ilişkilendirilmiş. */}
      {hata && (
        <p id={`${ad}-hata`} className="text-sm text-danger">
          {hata}
        </p>
      )}
    </div>
  );
}
