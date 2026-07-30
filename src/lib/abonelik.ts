// §4.8 dört seviye: tek ilan · yayınevi · koleksiyon · kapalı.
// "Kapalı" ayrı bir kayıt değil, kaydın YOKLUĞU — bu yüzden eylem çifti
// abone ol / aboneliği kaldır.
//
// Sabitler burada, "use server" dosyasında değil: bir server-action modülü
// yalnızca async fonksiyon dışa aktarabilir.

export type AbonelikHedefi = "ilan" | "kurum" | "koleksiyon";

export interface AbonelikDurumu {
  aboneMi: boolean;
  ofsetler: number[];
  hata?: string;
  /** Giriş yapılmadığı için işlem yapılamadı — arayüz giriş bağlantısı gösterir. */
  girisGerekli?: boolean;
}

// §4.8: "Ofsetler 7 / 3 / 1 gün önce, sınav günü sabahı. Varsayılan 3 ve 1."
// Keyfi değer kabul edilmez: her ofset ayrı planlanmış bir gönderim demek.
export const IZINLI_OFSETLER = [7, 3, 1, 0] as const;
export const VARSAYILAN_OFSETLER = [3, 1];

export const OFSET_ETIKETLERI: Record<number, string> = {
  7: "1 hafta önce",
  3: "3 gün önce",
  1: "1 gün önce",
  0: "Sınav günü sabahı",
};

export const OFSET_KISA: Record<number, string> = {
  7: "7 gün",
  3: "3 gün",
  1: "1 gün",
  0: "Sınav günü",
};

export function ofsetleriOzetle(ofsetler: number[]): string {
  if (ofsetler.length === 0) return "Hatırlatma kapalı";
  return [...ofsetler]
    .sort((a, b) => b - a)
    .map((o) => OFSET_KISA[o] ?? `${o} gün`)
    .join(" · ");
}
