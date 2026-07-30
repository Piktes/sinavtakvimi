import "server-only";
import { prisma } from "@/lib/prisma";
import type { SecenekListeleri } from "./ilan-formu";

// İlan formu ve toplu seri girişi aynı seçenek listelerini kullanır.
export async function formSecenekleri(): Promise<SecenekListeleri> {
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
    formatlar: etiketler.filter((e) => e.tip === "FORMAT"),
    duzeyler: etiketler.filter((e) => e.tip === "DUZEY"),
  };
}
