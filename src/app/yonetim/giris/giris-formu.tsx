"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { girisYap, type GirisDurumu } from "./actions";

const baslangic: GirisDurumu = {};

export function GirisFormu({ devam }: { devam: string }) {
  const [durum, eylem, beklemede] = useActionState(girisYap, baslangic);

  return (
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
    </form>
  );
}
