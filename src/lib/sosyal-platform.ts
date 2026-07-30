// Sabit platform listesi — Prisma enum değil (bkz. schema.prisma notu),
// yeni platform eklemek yalnızca bu dosyayı ve ikon eşlemesini güncellemeyi
// gerektirir, migration gerekmez.
export const SOSYAL_PLATFORMLAR = [
  "INSTAGRAM",
  "X",
  "FACEBOOK",
  "YOUTUBE",
  "TIKTOK",
  "WHATSAPP",
] as const;

export type SosyalPlatform = (typeof SOSYAL_PLATFORMLAR)[number];

export const SOSYAL_PLATFORM_ADLARI: Record<SosyalPlatform, string> = {
  INSTAGRAM: "Instagram",
  X: "X (Twitter)",
  FACEBOOK: "Facebook",
  YOUTUBE: "YouTube",
  TIKTOK: "TikTok",
  WHATSAPP: "WhatsApp",
};
