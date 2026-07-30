import { z } from "zod";

const bosaCevir = <T extends z.ZodTypeAny>(sema: T) =>
  z.preprocess((deger) => (deger === null || deger === "" ? undefined : deger), sema);

const dogruYanlis = z.preprocess((deger) => deger === "true", z.boolean());
const siraAlani = z.coerce.number().int().min(0).default(0);

// Bağlantı hem site içi göreli yol (/ilan/slug) hem dış URL olabilir —
// tek regex ikisini de kabul eder.
const baglantiOpsiyonel = bosaCevir(
  z
    .string()
    .trim()
    .max(500)
    .regex(/^(\/|https?:\/\/)/, "Bağlantı / ile başlayan göreli yol ya da https:// URL olmalı.")
    .optional(),
);

export const hikayeSemasi = z.object({
  baslik: z.string().trim().min(1, "Başlık zorunlu.").max(120),
  baglanti: baglantiOpsiyonel,
  sira: siraAlani,
  aktifMi: dogruYanlis,
});

export type HikayeGirdisi = z.infer<typeof hikayeSemasi>;
