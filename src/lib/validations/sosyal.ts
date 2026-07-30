import { z } from "zod";
import { SOSYAL_PLATFORMLAR } from "@/lib/sosyal-platform";

const dogruYanlis = z.preprocess((deger) => deger === "true", z.boolean());
const siraAlani = z.coerce.number().int().min(0).default(0);

export const sosyalBaglantiSemasi = z.object({
  platform: z.enum(SOSYAL_PLATFORMLAR, { message: "Platform seçin." }),
  url: z.url("Geçerli bir URL girin."),
  sira: siraAlani,
  aktifMi: dogruYanlis,
});

export type SosyalBaglantiGirdisi = z.infer<typeof sosyalBaglantiSemasi>;
