"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { CEREZ_OMRU, DUZEY_CEREZI, TEMA_CEREZI } from "@/lib/tercihler";

// §4.2 / §4.5: tercihler çereze yazılır; SSR bir sonraki istekte doğru
// değerle render eder (tema geçişinde sıçrama olmaz — kabul kriteri #12).
export async function duzeySec(duzeyId: string | null): Promise<void> {
  const cerezler = await cookies();

  if (duzeyId) {
    cerezler.set(DUZEY_CEREZI, duzeyId, {
      maxAge: CEREZ_OMRU,
      httpOnly: false,
      sameSite: "lax",
      path: "/",
    });
  } else {
    // "Sonra seçerim" — engelleyici değil, kullanıcı her şeyi görür.
    cerezler.delete(DUZEY_CEREZI);
  }

  revalidatePath("/", "layout");
}

export async function temaSec(tema: "acik" | "koyu"): Promise<void> {
  const cerezler = await cookies();
  cerezler.set(TEMA_CEREZI, tema, {
    maxAge: CEREZ_OMRU,
    httpOnly: false,
    sameSite: "lax",
    path: "/",
  });
  revalidatePath("/", "layout");
}
