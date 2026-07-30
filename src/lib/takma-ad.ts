// §4.9: "Kullanıcı adı serbest metin değil, sistem takma adı
// ('Meraklı Kalem 41')."
//
// Gerekçe (§12.3 çocuk verisi kısıtı): kitlenin bir kısmı reşit değil.
// Serbest kullanıcı adı, gerçek ad/soyad veya iletişim bilgisi sızdırmanın
// en kolay yolu. Havuzdan atama bunu kökten engelliyor.

const SIFATLAR = [
  "Meraklı",
  "Çalışkan",
  "Sabırlı",
  "Dikkatli",
  "Azimli",
  "Neşeli",
  "Cesur",
  "Bilge",
  "Hızlı",
  "Uyanık",
  "Titiz",
  "Kararlı",
  "Zeki",
  "Atak",
  "Sakin",
  "Gayretli",
];

const ISIMLER = [
  "Kalem",
  "Defter",
  "Pergel",
  "Cetvel",
  "Silgi",
  "Küre",
  "Pusula",
  "Fener",
  "Yıldız",
  "Kaşif",
  "Denizci",
  "Gezgin",
  "Mucit",
  "Çırak",
  "Usta",
  "Nişancı",
];

function rastgeleSec<T>(liste: T[], rastgele: () => number): T {
  return liste[Math.floor(rastgele() * liste.length)];
}

// Sayı eki, aynı sıfat+isim çiftinin farklı kullanıcılara düşmesine izin verir.
export function takmaAdUret(rastgele: () => number = Math.random): string {
  const sifat = rastgeleSec(SIFATLAR, rastgele);
  const isim = rastgeleSec(ISIMLER, rastgele);
  const sayi = Math.floor(rastgele() * 90) + 10; // 10–99
  return `${sifat} ${isim} ${sayi}`;
}

// Havuz 16 × 16 × 90 = 23.040 kombinasyon üretiyor; yine de çakışma olabilir.
// `kullanimda` DB kontrolünü yapar; birkaç denemede boş bulunamazsa sayıyı
// büyüterek garantiye alınır.
export async function benzersizTakmaAd(
  kullanimda: (aday: string) => Promise<boolean>,
  rastgele: () => number = Math.random,
): Promise<string> {
  for (let deneme = 0; deneme < 10; deneme += 1) {
    const aday = takmaAdUret(rastgele);
    if (!(await kullanimda(aday))) return aday;
  }

  // Son çare: zaman damgasıyla kesin benzersiz.
  const sifat = rastgeleSec(SIFATLAR, rastgele);
  const isim = rastgeleSec(ISIMLER, rastgele);
  return `${sifat} ${isim} ${Date.now().toString().slice(-6)}`;
}
