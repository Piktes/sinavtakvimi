// §7 SEO: Türkçe karakterden temizlenmiş slug (ç→c, ş→s, ı→i, ğ→g, ü→u, ö→o).
const HARF_HARITASI: Record<string, string> = {
  ç: "c",
  ğ: "g",
  ı: "i",
  ö: "o",
  ş: "s",
  ü: "u",
  Ç: "c",
  Ğ: "g",
  İ: "i",
  Ö: "o",
  Ş: "s",
  Ü: "u",
};

// NFD sonrası kalan birleşik aksan işaretleri (U+0300–U+036F).
const BIRLESIK_AKSAN = /[̀-ͯ]/g;

export function slugla(metin: string): string {
  return metin
    .split("")
    .map((karakter) => HARF_HARITASI[karakter] ?? karakter)
    .join("")
    .toLowerCase()
    .normalize("NFD")
    .replace(BIRLESIK_AKSAN, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
