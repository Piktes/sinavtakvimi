import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireRol } from "@/lib/rbac";
import { formatTarihAralik } from "@/lib/tarih";
import { NotYonetimi } from "./not-yonetimi";

export const metadata: Metadata = { title: "Takvim notları" };

export default async function TakvimNotlariSayfasi() {
  await requireRol(["ADMIN", "EDITOR"]);

  const notlar = await prisma.takvimNotu.findMany({ orderBy: { baslangic: "asc" } });

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-baslik text-2xl font-semibold text-text">Takvim notları</h1>
        <p className="text-sm text-text-muted">
          Tatil, bayram ve tahmini tarihler. Aylık takvimde gri bant olarak görünür.
        </p>
      </div>

      <NotYonetimi
        notlar={notlar.map((not) => ({
          id: not.id,
          ad: not.ad,
          baslangic: not.baslangic.toISOString().slice(0, 10),
          bitis: not.bitis.toISOString().slice(0, 10),
          tip: not.tip,
          aciklama: not.aciklama,
          aktifMi: not.aktifMi,
          gosterim: formatTarihAralik(not.baslangic, not.bitis),
        }))}
      />
    </div>
  );
}
