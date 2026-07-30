import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireRol } from "@/lib/rbac";
import { TipYonetimi } from "./tip-yonetimi";

export const metadata: Metadata = { title: "Kurum tipleri" };

export default async function KurumTipleriSayfasi() {
  await requireRol(["ADMIN", "EDITOR"]);

  const tipler = await prisma.kurumTipi.findMany({
    select: {
      id: true,
      ad: true,
      slug: true,
      sira: true,
      aktifMi: true,
      _count: { select: { kurumlar: true } },
    },
    orderBy: [{ sira: "asc" }, { ad: "asc" }],
  });

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-baslik text-2xl font-semibold text-text">Kurum tipleri</h1>
        <p className="text-sm text-text-muted">
          Yayınevi, dershane, kitabevi… Yeni bir tür eklemek için geliştirici gerekmez.
        </p>
      </div>

      <TipYonetimi
        tipler={tipler.map((tip) => ({
          id: tip.id,
          ad: tip.ad,
          slug: tip.slug,
          sira: tip.sira,
          aktifMi: tip.aktifMi,
          kurumSayisi: tip._count.kurumlar,
        }))}
      />
    </div>
  );
}
