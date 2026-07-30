import type { Metadata } from "next";
import { Card, CardGovde } from "@/components/ui/card";
import { requireGiris } from "@/lib/rbac";
import { SifreFormu } from "./sifre-formu";

export const metadata: Metadata = {
  title: "Şifre değiştir",
  robots: { index: false, follow: false },
};

export default async function SifreDegistirSayfasi() {
  await requireGiris();

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg p-4">
      <Card className="w-full max-w-sm">
        <CardGovde className="flex flex-col gap-5 p-5">
          <div className="flex flex-col gap-1">
            <h1 className="font-baslik text-xl font-semibold text-text">Şifre değiştir</h1>
            <p className="text-sm text-text-muted">
              Devam etmeden önce şifrenizi belirleyin. En az 8 karakter, büyük ve küçük harf,
              rakam.
            </p>
          </div>
          <SifreFormu />
        </CardGovde>
      </Card>
    </main>
  );
}
