import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRol } from "@/lib/rbac";
import { HikayeFormu } from "../hikaye-formu";

export const metadata: Metadata = { title: "Hikayeyi düzenle" };

export default async function HikayeDuzenleSayfasi({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRol(["ADMIN", "EDITOR"]);
  const { id } = await params;

  const hikaye = await prisma.hikaye.findUnique({ where: { id } });
  if (!hikaye) notFound();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-baslik text-2xl font-semibold text-text">Hikayeyi düzenle</h1>
      <HikayeFormu hikaye={hikaye} />
    </div>
  );
}
