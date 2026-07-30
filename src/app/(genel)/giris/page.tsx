import type { Metadata } from "next";
import { Card, CardGovde } from "@/components/ui/card";
import { GenelGirisFormu } from "./giris-formu";

export const metadata: Metadata = { title: "Giriş yap" };

export default async function GirisSayfasi({
  searchParams,
}: {
  searchParams: Promise<{ devam?: string; dogrulandi?: string; sifreDegisti?: string }>;
}) {
  const { devam, dogrulandi, sifreDegisti } = await searchParams;
  // Açık yönlendirme koruması: yalnızca site içi göreli yollar.
  const guvenliDevam = devam?.startsWith("/") && !devam.startsWith("//") ? devam : "/hesabim";

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4">
      <Card>
        <CardGovde className="flex flex-col gap-5 p-5">
          <div className="flex flex-col gap-1">
            <h1 className="font-baslik text-xl font-semibold text-text">Giriş yap</h1>
            <p className="text-sm text-text-muted">Bildirimlerini yönet, yorumlarını gör.</p>
          </div>

          {dogrulandi === "1" && (
            <p role="status" className="rounded-md bg-success-bg px-3 py-2 text-sm text-success">
              E-postanız doğrulandı. Şimdi giriş yapabilirsiniz.
            </p>
          )}

          {sifreDegisti === "1" && (
            <p role="status" className="rounded-md bg-success-bg px-3 py-2 text-sm text-success">
              Şifreniz değiştirildi. Yeni şifrenizle giriş yapın.
            </p>
          )}

          <GenelGirisFormu devam={guvenliDevam} />
        </CardGovde>
      </Card>
    </div>
  );
}
