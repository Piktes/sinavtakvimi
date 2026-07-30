// §4.8'in UNIQUE kısıtı `(abonelikId, ilanId, ofset)` — yani AYNI abonelikten
// aynı hatırlatmanın iki kez gitmesini engeller. Ama bir kullanıcı hem
// "Özdebir Deneme 01" ilanına hem de "YKS" koleksiyonuna abone olabilir; o
// zaman aynı sınav için İKİ FARKLI abonelikten iki e-posta gider.
//
// Şartname bunu açıkça yasaklamıyor ama kullanıcı açısından bu bir hata:
// aynı sabah aynı sınav için iki bildirim. Bu yüzden planlama aşamasında
// (kullanıcı, ilan, ofset) üçlüsü tekilleştiriliyor ve EN SPESİFİK abonelik
// kazanıyor — kullanıcı tek bir ilan için ayrıca abone olduysa hatırlatmanın
// o abonelikten gelmesi, "abonelikten çık" bağlantısının da doğru hedefi
// göstermesi demek.

/** Küçük sayı = daha spesifik. Eşitlikte ilk gelen kazanır. */
export const SEVIYE_SIRASI = { ilan: 0, kurum: 1, koleksiyon: 2 } as const;
export type AbonelikSeviyesi = keyof typeof SEVIYE_SIRASI;

export interface GonderimAdayi {
  kullaniciId: string;
  abonelikId: string;
  seviye: AbonelikSeviyesi;
  ilanId: string;
  ofset: number;
}

export function kullaniciAnahtari(kullaniciId: string, ilanId: string, ofset: number): string {
  return `${kullaniciId}:${ilanId}:${ofset}`;
}

export function tekillestir<T extends GonderimAdayi>(adaylar: T[]): T[] {
  const kazananlar = new Map<string, T>();

  for (const aday of adaylar) {
    const anahtar = kullaniciAnahtari(aday.kullaniciId, aday.ilanId, aday.ofset);
    const mevcut = kazananlar.get(anahtar);
    if (!mevcut || SEVIYE_SIRASI[aday.seviye] < SEVIYE_SIRASI[mevcut.seviye]) {
      kazananlar.set(anahtar, aday);
    }
  }

  return [...kazananlar.values()];
}
