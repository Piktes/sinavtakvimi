import "server-only";
import { prisma } from "@/lib/prisma";
import type { FiltreSecenekleri } from "./koleksiyon-formu";

export async function filtreSecenekleriGetir(): Promise<FiltreSecenekleri> {
  const [kurumlar, etiketler] = await Promise.all([
    prisma.kurum.findMany({
      where: { aktifMi: true },
      select: { id: true, ad: true },
      orderBy: { ad: "asc" },
    }),
    prisma.etiket.findMany({
      where: { aktifMi: true },
      select: { id: true, ad: true, tip: true },
      orderBy: { sira: "asc" },
    }),
  ]);

  return {
    kurumlar,
    gruplar: etiketler.filter((e) => e.tip === "GRUP"),
    duzeyler: etiketler.filter((e) => e.tip === "DUZEY"),
    formatlar: etiketler.filter((e) => e.tip === "FORMAT"),
  };
}
