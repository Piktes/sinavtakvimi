import { z } from "zod";
import { sifreSemasi } from "@/lib/validations/sifre";

// §7 KVKK + §12.3: 13 yaş beyanı zorunlu. Kutucuk işaretlenmeden kayıt olmaz.
export const kayitSemasi = z.object({
  eposta: z.email("Geçerli bir e-posta girin.").transform((deger) => deger.trim().toLowerCase()),
  sifre: sifreSemasi,
  yasBeyani: z.preprocess(
    (deger) => deger === "true",
    z.literal(true, { message: "Devam etmek için 13 yaşından büyük olduğunuzu onaylayın." }),
  ),
});

export const girisSemasi = z.object({
  eposta: z.email("Geçerli bir e-posta girin."),
  sifre: z.string().min(1, "Şifrenizi girin."),
});
