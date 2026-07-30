import { z } from "zod";

// §4.9: "İlan başına tek yorum + tek puan (1–5); puan yorumsuz da verilebilir."
//
// Tersi de doğru olmalı mı? Şartname "puan yorumsuz da verilebilir" diyor ama
// yorumsuz-puansız bir kayıt anlamsız. Bu yüzden kural: ikisinden EN AZ BİRİ
// dolu olmalı.

const bosaCevir = <T extends z.ZodTypeAny>(sema: T) =>
  z.preprocess((deger) => (deger === null || deger === "" ? undefined : deger), sema);

export const YORUM_EN_AZ = 10;
export const YORUM_EN_COK = 1000;

export const yorumSemasi = z
  .object({
    ilanId: z.string().min(1),
    puan: bosaCevir(
      z.coerce
        .number()
        .int("Puan tam sayı olmalı.")
        .min(1, "Puan 1 ile 5 arasında olmalı.")
        .max(5, "Puan 1 ile 5 arasında olmalı.")
        .optional(),
    ),
    icerik: bosaCevir(
      z
        .string()
        .trim()
        .min(YORUM_EN_AZ, `Yorum en az ${YORUM_EN_AZ} karakter olmalı.`)
        .max(YORUM_EN_COK, `Yorum en fazla ${YORUM_EN_COK} karakter olabilir.`)
        .optional(),
    ),
  })
  .refine((veri) => veri.puan !== undefined || veri.icerik !== undefined, {
    path: ["icerik"],
    message: "Puan verin ya da yorum yazın.",
  });

export type YorumGirdisi = z.infer<typeof yorumSemasi>;
