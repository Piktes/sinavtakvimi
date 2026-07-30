import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireRol } from "@/lib/rbac";
import { KurumFormu } from "../kurum-formu";

export const metadata: Metadata = { title: "Yeni kurum" };

export default async function YeniKurumSayfasi() {
  await requireRol(["ADMIN", "EDITOR"]);
  const tipler = await prisma.kurumTipi.findMany({
    where: { aktifMi: true },
    select: { id: true, ad: true },
    orderBy: { sira: "asc" },
  });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-baslik text-2xl font-semibold text-text">Yeni kurum</h1>
      <KurumFormu tipler={tipler} />
    </div>
  );
}
