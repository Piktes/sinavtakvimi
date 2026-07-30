import "server-only";
import { prisma } from "@/lib/prisma";

export async function aktifHikayeler() {
  return prisma.hikaye.findMany({
    where: { aktifMi: true },
    select: { id: true, baslik: true, gorselUrl: true, baglanti: true },
    orderBy: [{ sira: "asc" }, { olusturulma: "desc" }],
  });
}
