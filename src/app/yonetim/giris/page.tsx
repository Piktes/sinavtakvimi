import type { Metadata } from "next";
import { Card, CardGovde } from "@/components/ui/card";
import { GirisFormu } from "./giris-formu";

export const metadata: Metadata = {
  title: "Yönetim girişi",
  robots: { index: false, follow: false },
};

export default async function GirisSayfasi({
  searchParams,
}: {
  searchParams: Promise<{ devam?: string }>;
}) {
  const { devam } = await searchParams;

  // Açık yönlendirme (open redirect) engellenir: yalnızca site içi yollar.
  const guvenliDevam = devam?.startsWith("/yonetim") ? devam : "/yonetim";

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg p-4">
      <Card className="w-full max-w-sm">
        <CardGovde className="flex flex-col gap-5 p-5">
          <div className="flex flex-col gap-1">
            <h1 className="font-baslik text-xl font-semibold text-text">Yönetim paneli</h1>
            <p className="text-sm text-text-muted">Devam etmek için giriş yapın.</p>
          </div>
          <GirisFormu devam={guvenliDevam} />
        </CardGovde>
      </Card>
    </main>
  );
}
