import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ILAN_SUTUNLARI } from "@/lib/ice-aktarma/ilan-sutunlari";
import { requireRol } from "@/lib/rbac";
import { IceAktarmaFormu } from "./ice-aktarma-formu";

export const metadata: Metadata = { title: "İçe aktarma" };

export default async function IceAktarmaSayfasi() {
  await requireRol(["ADMIN", "EDITOR"]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-baslik text-2xl font-semibold text-text">
            Excel/CSV ile içe aktarma
          </h1>
          <p className="text-sm text-text-muted">
            Şablonu indirin, doldurun, yükleyin. Kaydedilmeden önce satır satır kontrol edilir.
          </p>
        </div>
        <Button varyant="ikincil" boyut="sm">
          <Link href="/yonetim/ilanlar/ice-aktar/gecmis">Yükleme geçmişi</Link>
        </Button>
      </div>

      <IceAktarmaFormu sutunlar={ILAN_SUTUNLARI} />
    </div>
  );
}
