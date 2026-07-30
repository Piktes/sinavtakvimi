import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireRol } from "@/lib/rbac";
import { EtiketYonetimi } from "./etiket-yonetimi";

export const metadata: Metadata = { title: "Etiketler" };

export default async function EtiketlerSayfasi() {
  await requireRol(["ADMIN", "EDITOR"]);

  const etiketler = await prisma.etiket.findMany({
    select: {
      id: true,
      tip: true,
      ad: true,
      slug: true,
      kisaAd: true,
      sira: true,
      aktifMi: true,
      _count: { select: { grupIlanlari: true, formatIlanlari: true, duzeyIlanlari: true } },
    },
    orderBy: [{ tip: "asc" }, { sira: "asc" }],
  });

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-baslik text-2xl font-semibold text-text">Etiketler</h1>
        <p className="text-sm text-text-muted">
          İlanların sınıflandırması. Buraya eklenen her etiket ilan formunda ve filtrelerde anında
          görünür.
        </p>
      </div>

      <EtiketYonetimi
        etiketler={etiketler.map((etiket) => ({
          id: etiket.id,
          tip: etiket.tip,
          ad: etiket.ad,
          slug: etiket.slug,
          kisaAd: etiket.kisaAd,
          sira: etiket.sira,
          aktifMi: etiket.aktifMi,
          // Etiket üç rolde birden kullanılabilir; hepsini topluyoruz.
          kullanim:
            etiket._count.grupIlanlari + etiket._count.formatIlanlari + etiket._count.duzeyIlanlari,
        }))}
      />
    </div>
  );
}
