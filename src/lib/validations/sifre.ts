import { z } from "zod";

// §7 güvenlik: şifre politikası. İstemci ve sunucu aynı şemayı kullanır.
export const sifreSemasi = z
  .string()
  .min(8, "Şifre en az 8 karakter olmalı.")
  .regex(/[a-zçğıöşü]/, "Şifre en az bir küçük harf içermeli.")
  .regex(/[A-ZÇĞİÖŞÜ]/, "Şifre en az bir büyük harf içermeli.")
  .regex(/[0-9]/, "Şifre en az bir rakam içermeli.");

export const sifreDegistirmeSemasi = z
  .object({
    mevcutSifre: z.string().min(1, "Mevcut şifrenizi girin."),
    yeniSifre: sifreSemasi,
    yeniSifreTekrar: z.string(),
  })
  .refine((veri) => veri.yeniSifre === veri.yeniSifreTekrar, {
    path: ["yeniSifreTekrar"],
    message: "Şifreler eşleşmiyor.",
  });
