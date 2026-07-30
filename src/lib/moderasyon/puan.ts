// §4.9: "ortalama yalnızca onaylılardan, en az 5 puan toplanana kadar
// gösterilmez."
//
// Saf kısım burada, DB'ye dokunan kısım `puan-hesapla.ts`'te — eşik kuralı
// hem sunucu hem istemcide aynı yerden okunsun.

export const PUAN_ESIGI = 5;

/** Ortalama gösterilebilir mi? Az sayıda puan yanıltıcı bir ortalama üretir. */
export function ortalamaGosterilir(puanSayisi: number): boolean {
  return puanSayisi >= PUAN_ESIGI;
}

/** Eşiğe ne kadar kaldı — kullanıcıya "3 değerlendirme daha" demek için. */
export function esigeKalan(puanSayisi: number): number {
  return Math.max(0, PUAN_ESIGI - puanSayisi);
}

/** Ortalamayı bir ondalıkla yuvarlar; puan yoksa null. */
export function ortalamaHesapla(puanlar: number[]): number | null {
  if (puanlar.length === 0) return null;
  const toplam = puanlar.reduce((a, b) => a + b, 0);
  return Number((toplam / puanlar.length).toFixed(1));
}
