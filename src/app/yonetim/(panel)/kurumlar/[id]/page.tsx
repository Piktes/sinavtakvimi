import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRol } from "@/lib/rbac";
import { KurumFormu } from "../kurum-formu";

export const metadata: Metadata = { title: "Kurumu düzenle" };

export default async function KurumDuzenleSayfasi({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRol(["ADMIN", "EDITOR"]);
  const { id } = await params;

  const [kurum, tipler] = await Promise.all([
    prisma.kurum.findUnique({ where: { id } }),
    prisma.kurumTipi.findMany({
      where: { aktifMi: true },
      select: { id: true, ad: true },
      orderBy: { sira: "asc" },
    }),
  ]);

  if (!kurum) notFound();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-baslik text-2xl font-semibold text-text">Kurumu düzenle</h1>
      <KurumFormu kurum={kurum} tipler={tipler} />
    </div>
  );
}
