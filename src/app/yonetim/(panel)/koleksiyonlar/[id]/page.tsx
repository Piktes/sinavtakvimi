import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRol } from "@/lib/rbac";
import { filtreOku } from "@/lib/validations/koleksiyon";
import { KoleksiyonFormu } from "../koleksiyon-formu";
import { filtreSecenekleriGetir } from "../secenekler";

export const metadata: Metadata = { title: "Koleksiyonu düzenle" };

export default async function KoleksiyonDuzenleSayfasi({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRol(["ADMIN", "EDITOR"]);
  const { id } = await params;

  const [koleksiyon, secenekler] = await Promise.all([
    prisma.koleksiyon.findUnique({ where: { id } }),
    filtreSecenekleriGetir(),
  ]);

  if (!koleksiyon) notFound();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-baslik text-2xl font-semibold text-text">Koleksiyonu düzenle</h1>
      <KoleksiyonFormu
        secenekler={secenekler}
        koleksiyon={{ ...koleksiyon, filtre: filtreOku(koleksiyon.filtre) }}
      />
    </div>
  );
}
