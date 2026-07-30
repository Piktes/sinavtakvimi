import { z } from "zod";
import { UygulamaTipi, Zorluk } from "@/generated/prisma/enums";

// §2: Koleksiyon.filtre jsonb'sinin TEK kaynağı — "serbest bırakılmayacak".
// Admin filtre kurucusu (§6) bu şemaya karşı doğrular, genel site (§4.3) bu
// şemaya karşı parse edip sorguya çevirir. Boş dizi = o facette filtre yok.
//
// ID'ler kullanılıyor (slug değil): admin bir etiketin adını veya slug'ını
// değiştirdiğinde kayıtlı filtreler kırılmasın.
export const koleksiyonFiltresiSemasi = z.object({
  grupIds: z.array(z.string()).default([]),
  duzeyIds: z.array(z.string()).default([]),
  formatIds: z.array(z.string()).default([]),
  kurumIds: z.array(z.string()).default([]),
  uygulamaTipi: z.array(z.enum(UygulamaTipi)).default([]),
  zorluk: z.array(z.enum(Zorluk)).default([]),
  // §2.2 örneği: "format = TYT-AYT, ad içerir 'Fen Lis.'"
  baslikIcerir: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((deger) => (deger ? deger : undefined)),
});

export type KoleksiyonFiltresi = z.infer<typeof koleksiyonFiltresiSemasi>;

export const BOS_FILTRE: KoleksiyonFiltresi = {
  grupIds: [],
  duzeyIds: [],
  formatIds: [],
  kurumIds: [],
  uygulamaTipi: [],
  zorluk: [],
  baslikIcerir: undefined,
};

// Kaydedilmiş jsonb'yi güvenle okur. Geçersizse boş filtreye düşer —
// tek bir bozuk kayıt tüm sayfayı çökertmesin.
export function filtreOku(deger: unknown): KoleksiyonFiltresi {
  const sonuc = koleksiyonFiltresiSemasi.safeParse(deger);
  return sonuc.success ? sonuc.data : BOS_FILTRE;
}
