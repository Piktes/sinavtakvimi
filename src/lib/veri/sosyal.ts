import "server-only";
import { prisma } from "@/lib/prisma";

export async function aktifSosyalBaglantilar() {
  return prisma.sosyalBaglanti.findMany({
    where: { aktifMi: true },
    select: { id: true, platform: true, url: true },
    orderBy: { sira: "asc" },
  });
}
