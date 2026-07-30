import { createHmac, timingSafeEqual } from "node:crypto";

// §4.8: "Her e-postada giriş gerektirmeyen imzalı abonelikten çık bağlantısı."
//
// Kullanıcı e-postadaki bağlantıya tıklayınca giriş yapmadan aboneliğini
// kapatabilmeli. Bağlantı tahmin edilemez ve değiştirilemez olmalı: veri +
// HMAC imzası taşınır, sunucu imzayı doğrular.
//
// DB'de token saklamıyoruz — imza kendi kendini doğruluyor, ayrıca tablo
// gerekmiyor.

function gizliAnahtar(): string {
  const anahtar = process.env.AUTH_SECRET;
  if (!anahtar) throw new Error("AUTH_SECRET tanımlı değil — imzalı bağlantı üretilemez.");
  return anahtar;
}

function imzala(veri: string): string {
  return createHmac("sha256", gizliAnahtar()).update(veri).digest("base64url");
}

// base64url: URL'de kaçış gerektirmez.
export function imzaliJetonUret(yuk: Record<string, string>): string {
  const govde = Buffer.from(JSON.stringify(yuk), "utf8").toString("base64url");
  return `${govde}.${imzala(govde)}`;
}

export function imzaliJetonCoz(jeton: string): Record<string, string> | null {
  const [govde, imza] = jeton.split(".");
  if (!govde || !imza) return null;

  const beklenen = imzala(govde);

  // Sabit zamanlı karşılaştırma: imza doğrulamasında erken çıkış, saldırgana
  // bilgi sızdırır.
  const a = Buffer.from(imza);
  const b = Buffer.from(beklenen);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    return JSON.parse(Buffer.from(govde, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}
