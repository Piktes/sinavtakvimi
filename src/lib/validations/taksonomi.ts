import { z } from "zod";
import { EtiketTipi, Gorunum, TakvimNotuTipi } from "@/generated/prisma/enums";

// §7: Zod ile doğrulama her zaman sunucu tarafında; istemci aynı şemayı
// kullanır. Bu dosya Adım 7 ekranlarının (kurum, kurum tipi, etiket,
// koleksiyon, takvim notu) ortak şemalarını tutar.

const slugAlani = z
  .string()
  .trim()
  .max(200)
  .regex(/^[a-z0-9-]*$/, "Slug yalnızca küçük harf, rakam ve tire içerebilir.")
  .optional()
  .transform((deger) => (deger ? deger : undefined));

const metinOpsiyonel = (enFazla: number) =>
  z
    .string()
    .trim()
    .max(enFazla)
    .optional()
    .transform((deger) => (deger ? deger : undefined));

const urlOpsiyonel = z
  .union([z.literal(""), z.url("Geçerli bir URL girin.")])
  .optional()
  .transform((deger) => (deger ? deger : undefined));

const dogruYanlis = z.preprocess((deger) => deger === "true", z.boolean());
const siraAlani = z.coerce.number().int().min(0).default(0);

export const kurumTipiSemasi = z.object({
  ad: z.string().trim().min(2, "Ad en az 2 karakter olmalı.").max(100),
  slug: slugAlani,
  sira: siraAlani,
  aktifMi: dogruYanlis,
});

export const kurumSemasi = z.object({
  ad: z.string().trim().min(2, "Ad en az 2 karakter olmalı.").max(200),
  slug: slugAlani,
  tipId: z.string().min(1, "Kurum tipi seçin."),
  webSitesi: urlOpsiyonel,
  aciklamaMd: metinOpsiyonel(5000),
  // §6 "Yayınevi vitrini": logo duvarındaki sıra.
  sira: siraAlani,
  aktifMi: dogruYanlis,
});

export const etiketSemasi = z.object({
  tip: z.enum(EtiketTipi, { message: "Etiket tipi seçin." }),
  ad: z.string().trim().min(1, "Ad zorunlu.").max(100),
  slug: slugAlani,
  kisaAd: metinOpsiyonel(50),
  sira: siraAlani,
  aktifMi: dogruYanlis,
});

export const takvimNotuSemasi = z
  .object({
    ad: z.string().trim().min(2, "Ad en az 2 karakter olmalı.").max(200),
    baslangic: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Geçerli bir tarih girin."),
    bitis: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Geçerli bir tarih girin."),
    tip: z.enum(TakvimNotuTipi, { message: "Not tipi seçin." }),
    aciklama: metinOpsiyonel(500),
    aktifMi: dogruYanlis,
  })
  .refine((veri) => veri.bitis >= veri.baslangic, {
    path: ["bitis"],
    message: "Bitiş tarihi başlangıçtan önce olamaz.",
  });

export const koleksiyonSemasi = z.object({
  ad: z.string().trim().min(2, "Ad en az 2 karakter olmalı.").max(100),
  slug: slugAlani,
  sira: siraAlani,
  aktifMi: dogruYanlis,
  ikon: metinOpsiyonel(50),
  varsayilanGorunum: z.enum(Gorunum, { message: "Görünüm seçin." }),
  menudeMi: dogruYanlis,
  anaSayfadaMi: dogruYanlis,
});
