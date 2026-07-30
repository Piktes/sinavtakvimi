"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import {
  dogrulamaBaglantisiniTekrarGonder,
  girisYapGenel,
  type UyelikDurumu,
} from "@/app/(genel)/uyelik-actions";

const baslangic: UyelikDurumu = {};

export function GenelGirisFormu({ devam }: { devam: string }) {
  const [durum, eylem, beklemede] = useActionState(girisYapGenel, baslangic);
  const [tekrarDurumu, tekrarEylemi, tekrarBekliyor] = useActionState(
    dogrulamaBaglantisiniTekrarGonder,
    baslangic,
  );

  return (
    <div className="flex flex-col gap-5">
      <form action={eylem} className="flex flex-col gap-4">
        <input type="hidden" name="devam" value={devam} />

        <div className="flex flex-col gap-2">
          <Label htmlFor="eposta">E-posta</Label>
          <Input id="eposta" name="eposta" type="email" autoComplete="username" required />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="sifre">Şifre</Label>
          <Input id="sifre" name="sifre" type="password" autoComplete="current-password" required />
        </div>

        {durum.hata && (
          <p role="alert" className="text-sm text-danger">
            {durum.hata}
          </p>
        )}

        <Button type="submit" disabled={beklemede}>
          {beklemede ? "Giriş yapılıyor…" : "Giriş yap"}
        </Button>

        <p className="text-sm text-text-muted">
          Hesabın yok mu?{" "}
          <Link href="/kayit" className="underline">
            Kayıt ol
          </Link>
        </p>
      </form>

      <details className="border-t border-border pt-4 text-sm">
        <summary className="cursor-pointer text-text-muted">
          Doğrulama e-postası gelmedi mi?
        </summary>
        <form action={tekrarEylemi} className="mt-3 flex flex-col gap-2">
          <Label htmlFor="tekrar-eposta">E-posta</Label>
          <Input id="tekrar-eposta" name="eposta" type="email" required />
          <Button type="submit" varyant="ikincil" boyut="sm" disabled={tekrarBekliyor}>
            {tekrarBekliyor ? "Gönderiliyor…" : "Bağlantıyı yeniden gönder"}
          </Button>
          {tekrarDurumu.bilgi && <p className="text-sm text-success">{tekrarDurumu.bilgi}</p>}
          {tekrarDurumu.hata && <p className="text-sm text-danger">{tekrarDurumu.hata}</p>}
        </form>
      </details>
    </div>
  );
}
