import { z } from "zod";
import { UygulamaTipi, YayinDurumu, Zorluk } from "@/generated/prisma/enums";
import { ILLER } from "@/lib/iller";

// §7 güvenlik: "Girdi doğrulama Zod ile sunucu tarafında HER ZAMAN."
// İstemci ve sunucu aynı şemayı kullanır.

// <input type="date"> → salt tarih. @db.Date sütunları saat taşımaz.
const tarihZorunlu = z
  .string()
  .min(1, "Sınav tarihi zorunlu.")
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Geçerli bir tarih girin.");

const tarihOpsiyonel = z
  .union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Geçerli bir tarih girin.")])
  .optional()
  .transform((deger) => (deger ? deger : undefined));

const saatOpsiyonel = z
  .union([z.literal(""), z.string().regex(/^\d{2}:\d{2}$/, "Saat SS:DD biçiminde olmalı.")])
  .optional()
  .transform((deger) => (deger ? deger : undefined));

const sayiOpsiyonel = z.preprocess(
  (deger) => (deger === "" || deger === null || deger === undefined ? undefined : Number(deger)),
  z.number().int().positive().optional(),
);

const metinOpsiyonel = (enFazla: number) =>
  z
    .string()
    .trim()
    .max(enFazla)
    .optional()
    .transform((deger) => (deger ? deger : undefined));

// §2: Oturum opsiyonel, çoğu ilanda boş.
export const oturumSemasi = z.object({
  ad: z.string().trim().min(1, "Oturum adı zorunlu.").max(100),
  saat: saatOpsiyonel,
  sureDk: sayiOpsiyonel,
  soruSayisi: sayiOpsiyonel,
});

export type OturumGirdisi = z.infer<typeof oturumSemasi>;

export const ilanSemasi = z
  .object({
    baslik: z.string().trim().min(3, "Başlık en az 3 karakter olmalı.").max(300),
    slug: z
      .string()
      .trim()
      .max(300)
      .regex(/^[a-z0-9-]*$/, "Slug yalnızca küçük harf, rakam ve tire içerebilir.")
      .optional()
      .transform((deger) => (deger ? deger : undefined)),
    seriNo: sayiOpsiyonel,

    kurumId: z.string().min(1, "Kurum seçin."),
    dagiticiKurumId: z
      .union([z.literal(""), z.string()])
      .optional()
      .transform((deger) => (deger ? deger : undefined)),
    grupId: z.string().min(1, "Grup seçin."),
    formatId: z.string().min(1, "Format seçin."),
    duzeyIds: z.array(z.string()).min(1, "En az bir düzey seçin."),

    sinavTarihi: tarihZorunlu,
    sinavBitisTarihi: tarihOpsiyonel,
    saat: saatOpsiyonel,
    sonSiparisTarihi: tarihOpsiyonel,
    // <input type="datetime-local"> → "YYYY-MM-DDTHH:mm"
    cevapAnahtariZamani: z
      .union([z.literal(""), z.string()])
      .optional()
      .transform((deger) => (deger ? deger : undefined)),

    uygulamaTipi: z.enum(UygulamaTipi, { message: "Uygulama tipi seçin." }),
    // Yalnızca Kurumsal'da anlamlı — bkz. superRefine.
    il: z
      .union([z.literal(""), z.enum(ILLER)])
      .optional()
      .transform((deger) => (deger ? deger : undefined)),
    zorluk: z
      .union([z.literal(""), z.enum(Zorluk)])
      .optional()
      .transform((deger) => (deger ? deger : undefined)),

    aciklamaMd: metinOpsiyonel(10_000),
    afisUrl: z
      .union([z.literal(""), z.url("Geçerli bir URL girin.")])
      .optional()
      .transform((deger) => (deger ? deger : undefined)),
    detayUrl: z
      .union([z.literal(""), z.url("Geçerli bir URL girin.")])
      .optional()
      .transform((deger) => (deger ? deger : undefined)),

    // Boş bırakılırsa sinavTarihi'nden türetilir (src/lib/sezon.ts).
    sezon: metinOpsiyonel(20),
    oneCikar: z.preprocess((deger) => deger === "true", z.boolean()),
    yayinDurumu: z.enum(YayinDurumu, { message: "Yayın durumu seçin." }),

    oturumlar: z.array(oturumSemasi).default([]),
  })
  .superRefine((veri, ctx) => {
    // §2 değişmez kural: bitiş doluysa sınav tarihinden sonra olmalı.
    // Aynı kural DB'de de var (ilanlar_bitis_sinavdan_sonra CHECK) — Zod
    // katmanı seed/elle SQL ile atlanabildiği için ikisi birden gerekli.
    if (veri.sinavBitisTarihi && veri.sinavBitisTarihi <= veri.sinavTarihi) {
      ctx.addIssue({
        code: "custom",
        path: ["sinavBitisTarihi"],
        message: "Bitiş tarihi, sınav tarihinden sonra olmalı.",
      });
    }

    if (veri.sonSiparisTarihi && veri.sonSiparisTarihi > veri.sinavTarihi) {
      ctx.addIssue({
        code: "custom",
        path: ["sonSiparisTarihi"],
        message: "Son sipariş tarihi, sınav tarihinden sonra olamaz.",
      });
    }
  });

export type IlanGirdisi = z.infer<typeof ilanSemasi>;

// §4.1 toplu seri girişi: ortak alanlar bir kez, tarihler satır satır.
export const seriSatiriSemasi = z.object({
  sinavTarihi: tarihZorunlu,
  sinavBitisTarihi: tarihOpsiyonel,
  sonSiparisTarihi: tarihOpsiyonel,
  cevapAnahtariZamani: z
    .union([z.literal(""), z.string()])
    .optional()
    .transform((deger) => (deger ? deger : undefined)),
});

export const topluSeriSemasi = z.object({
  baslikOnEki: z.string().trim().min(3, "Başlık ön eki en az 3 karakter olmalı.").max(200),
  kurumId: z.string().min(1, "Kurum seçin."),
  dagiticiKurumId: z
    .union([z.literal(""), z.string()])
    .optional()
    .transform((deger) => (deger ? deger : undefined)),
  grupId: z.string().min(1, "Grup seçin."),
  formatId: z.string().min(1, "Format seçin."),
  duzeyIds: z.array(z.string()).min(1, "En az bir düzey seçin."),
  uygulamaTipi: z.enum(UygulamaTipi, { message: "Uygulama tipi seçin." }),
  zorluk: z
    .union([z.literal(""), z.enum(Zorluk)])
    .optional()
    .transform((deger) => (deger ? deger : undefined)),
  saat: saatOpsiyonel,
  baslangicNo: z.coerce.number().int().min(1).default(1),
  satirlar: z.array(seriSatiriSemasi).min(1, "En az bir tarih satırı girin."),
});

export type TopluSeriGirdisi = z.infer<typeof topluSeriSemasi>;
