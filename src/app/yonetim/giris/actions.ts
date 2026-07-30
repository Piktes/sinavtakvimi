"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";

export interface GirisDurumu {
  hata?: string;
}

// §7 güvenlik: hata mesajı e-postanın kayıtlı olup olmadığını sızdırmaz.
export async function girisYap(
  _oncekiDurum: GirisDurumu | undefined,
  formData: FormData,
): Promise<GirisDurumu> {
  const devam = (formData.get("devam") as string) || "/yonetim";

  try {
    await signIn("credentials", {
      eposta: formData.get("eposta"),
      sifre: formData.get("sifre"),
      redirectTo: devam,
    });
    return {};
  } catch (hata) {
    // signIn başarılı olduğunda Next.js yönlendirme için hata fırlatır;
    // bu hatayı yutmamak gerekir.
    if (hata instanceof AuthError) {
      return { hata: "E-posta veya şifre hatalı." };
    }
    throw hata;
  }
}
