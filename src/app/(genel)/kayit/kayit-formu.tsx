"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { kayitOl, type UyelikDurumu } from "@/app/(genel)/uyelik-actions";

const baslangic: UyelikDurumu = {};

export function KayitFormu() {
  const [durum, eylem, beklemede] = useActionState(kayitOl, baslangic);

  if (durum.bilgi) {
    return (
      <div className="flex flex-col gap-3">
        <p role="status" className="rounded-md bg-success-bg px-3 py-2 text-sm text-success">
          {durum.bilgi}
        </p>
        <p className="text-sm text-text-muted">
          Bağlantı gelmediyse spam klasörünü kontrol edin veya{" "}
          <Link href="/giris" className="underline">
            giriş sayfasından
          </Link>{" "}
          yeniden gönderin.
        </p>
      </div>
    );
  }

  return (
    <form action={eylem} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="eposta">E-posta</Label>
        <Input id="eposta" name="eposta" type="email" autoComplete="email" required />
        {durum.alanHatalari?.eposta && (
          <p className="text-sm text-danger">{durum.alanHatalari.eposta}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="sifre">Şifre</Label>
        <Input id="sifre" name="sifre" type="password" autoComplete="new-password" required />
        <p className="text-xs text-text-muted">
          En az 8 karakter, bir büyük ve bir küçük harf, bir rakam.
        </p>
        {durum.alanHatalari?.sifre && (
          <p className="text-sm text-danger">{durum.alanHatalari.sifre}</p>
        )}
      </div>

      {/* §12.3 / §7: 13 yaş beyanı zorunlu. */}
      <div className="flex flex-col gap-2">
        <label className="flex items-start gap-2 text-sm text-text">
          <input type="checkbox" name="yasBeyani" value="true" className="mt-0.5" />
          <span>13 yaşından büyüğüm.</span>
        </label>
        {durum.alanHatalari?.yasBeyani && (
          <p className="text-sm text-danger">{durum.alanHatalari.yasBeyani}</p>
        )}
      </div>

      <p className="text-xs text-text-muted">
        Takma adınız sistem tarafından atanır (ör. &ldquo;Meraklı Kalem 41&rdquo;); ad soyad
        istemiyoruz.
      </p>

      {durum.hata && (
        <p role="alert" className="text-sm text-danger">
          {durum.hata}
        </p>
      )}

      <Button type="submit" disabled={beklemede}>
        {beklemede ? "Kaydediliyor…" : "Kayıt ol"}
      </Button>

      <p className="text-sm text-text-muted">
        Zaten hesabın var mı?{" "}
        <Link href="/giris" className="underline">
          Giriş yap
        </Link>
      </p>
    </form>
  );
}
