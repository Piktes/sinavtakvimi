import type { Metadata } from "next";
import { Card, CardGovde } from "@/components/ui/card";
import { KayitFormu } from "./kayit-formu";

export const metadata: Metadata = {
  title: "Kayıt ol",
  description: "Sınav ilanları için bildirim al, yorum yap.",
};

export default function KayitSayfasi() {
  return (
    <div className="mx-auto flex max-w-md flex-col gap-4">
      <Card>
        <CardGovde className="flex flex-col gap-5 p-5">
          <div className="flex flex-col gap-1">
            <h1 className="font-baslik text-xl font-semibold text-text">Kayıt ol</h1>
            <p className="text-sm text-text-muted">
              Bildirim almak ve yorum yapmak için hesap oluşturun.
            </p>
          </div>
          <KayitFormu />
        </CardGovde>
      </Card>
    </div>
  );
}
