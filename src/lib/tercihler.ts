import "server-only";
import { cookies } from "next/headers";

// §4.2: kalıcı düzey seçimi — "en önemli tek karar". Giriş gerektirmeden
// çereze yazılır, tüm sayfalarda varsayılan filtre olur. Giriş yapmışsa
// hesaba da kaydedilir (Kullanici.duzeyId) — o katman §8 Adım 8'de.
export const DUZEY_CEREZI = "duzey";
export const TEMA_CEREZI = "tema";

// 1 yıl: sezon boyu korunsun.
export const CEREZ_OMRU = 60 * 60 * 24 * 365;

export async function seciliDuzeyId(): Promise<string | null> {
  const cerezler = await cookies();
  return cerezler.get(DUZEY_CEREZI)?.value ?? null;
}

export async function seciliTema(): Promise<"acik" | "koyu" | null> {
  const cerezler = await cookies();
  const deger = cerezler.get(TEMA_CEREZI)?.value;
  return deger === "acik" || deger === "koyu" ? deger : null;
}

// Kullanıcı hiç seçim yapmamışsa uygulanacak tema. Sistem tercihine (prefers-
// color-scheme) BAKILMAZ — açılışta her zaman öngörülebilir tek bir görünüm:
// açık. (Şartname §5 V3 için koyu varsayılan öngörüyordu; ürün kararıyla
// üç versiyonda da açık varsayılana geçildi.)
export function varsayilanTema(): "acik" {
  return "acik";
}
