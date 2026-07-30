import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRol } from "@/lib/rbac";
import { SosyalBaglantiFormu } from "../sosyal-baglanti-formu";

export const metadata: Metadata = { title: "Sosyal bağlantıyı düzenle" };

export default async function SosyalBaglantiDuzenleSayfasi({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRol(["ADMIN", "EDITOR"]);
  const { id } = await params;

  const baglanti = await prisma.sosyalBaglanti.findUnique({ where: { id } });
  if (!baglanti) notFound();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-baslik text-2xl font-semibold text-text">Sosyal bağlantıyı düzenle</h1>
      <SosyalBaglantiFormu baglanti={baglanti} />
    </div>
  );
}
