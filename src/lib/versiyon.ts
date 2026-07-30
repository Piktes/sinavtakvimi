import "server-only";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

// §5: "Aktif versiyon `Ayar` tablosundan; `?tema=v2` ile önizlenir."
export const VERSIYONLAR = ["v1", "v2", "v3"] as const;
export type Versiyon = (typeof VERSIYONLAR)[number];

export const VERSIYON_ADLARI: Record<Versiyon, string> = {
  v1: "Ajanda",
  v2: "Vitrin",
  v3: "Akış",
};

export const AKTIF_VERSIYON_AYARI = "aktif_versiyon";
export const VERSIYON_ONIZLEME_CEREZI = "versiyon-onizleme";

function gecerliMi(deger: unknown): deger is Versiyon {
  return typeof deger === "string" && (VERSIYONLAR as readonly string[]).includes(deger);
}

// Önizleme çerezi (middleware `?tema=` parametresinden yazar) varsa o kazanır;
// yoksa Ayar tablosundaki aktif versiyon; o da yoksa v1.
export async function aktifVersiyon(): Promise<Versiyon> {
  const cerezler = await cookies();
  const onizleme = cerezler.get(VERSIYON_ONIZLEME_CEREZI)?.value;
  if (gecerliMi(onizleme)) return onizleme;

  const ayar = await prisma.ayar.findUnique({ where: { anahtar: AKTIF_VERSIYON_AYARI } });
  return gecerliMi(ayar?.deger) ? ayar.deger : "v1";
}
