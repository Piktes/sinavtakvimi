// §2: Tüm zamanlar DB'de UTC, arayüzde Europe/Istanbul (UTC+3 sabit).
// §3.7: Tarih biçimlendirme TEK bu modülden geçer — hiçbir bileşende
// `toLocaleDateString` çağrılmayacak.
//
// Türkiye'de yaz saati uygulaması yok, bu yüzden sabit ofsetle çevrilebilir;
// IANA veritabanına ihtiyaç duyulmuyor.
const ISTANBUL_OFSET_DK = 3 * 60;

const AYLAR = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
];

const AYLAR_KISA = [
  "Oca",
  "Şub",
  "Mar",
  "Nis",
  "May",
  "Haz",
  "Tem",
  "Ağu",
  "Eyl",
  "Eki",
  "Kas",
  "Ara",
];

const GUNLER = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];

// UTC anını Europe/Istanbul duvar saatine kaydırır. Dönen Date nesnesinin
// `getUTC*` alanları İstanbul'daki değerleri verir — yerel makine saat
// diliminden bağımsız, sunucu ve istemcide aynı sonuç.
function istanbulaKaydir(tarih: Date): Date {
  return new Date(tarih.getTime() + ISTANBUL_OFSET_DK * 60_000);
}

// @db.Date sütunları Prisma tarafından UTC gece yarısı olarak okunur; bunlara
// +3 saat eklemek günü kaydırmaz ama saatli alanlarla aynı yolu kullanmak
// tutarlılık sağlar.
export function formatTarih(tarih: Date): string {
  const d = istanbulaKaydir(tarih);
  return `${d.getUTCDate()} ${AYLAR[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

// "30 Ekim – 1 Kasım 2026" · aynı ay ise "9–12 Ekim 2026" · aynı gün ise tek tarih.
export function formatTarihAralik(baslangic: Date, bitis: Date | null | undefined): string {
  if (!bitis) return formatTarih(baslangic);

  const a = istanbulaKaydir(baslangic);
  const b = istanbulaKaydir(bitis);

  if (gunAnahtari(baslangic) === gunAnahtari(bitis)) return formatTarih(baslangic);

  const ayniYil = a.getUTCFullYear() === b.getUTCFullYear();
  const ayniAy = ayniYil && a.getUTCMonth() === b.getUTCMonth();

  if (ayniAy) {
    return `${a.getUTCDate()}–${b.getUTCDate()} ${AYLAR[b.getUTCMonth()]} ${b.getUTCFullYear()}`;
  }
  if (ayniYil) {
    return `${a.getUTCDate()} ${AYLAR[a.getUTCMonth()]} – ${b.getUTCDate()} ${AYLAR[b.getUTCMonth()]} ${b.getUTCFullYear()}`;
  }
  return `${formatTarih(baslangic)} – ${formatTarih(bitis)}`;
}

// "1 Kasım 2026, 20:00"
export function formatTarihSaat(tarih: Date): string {
  const d = istanbulaKaydir(tarih);
  const saat = String(d.getUTCHours()).padStart(2, "0");
  const dakika = String(d.getUTCMinutes()).padStart(2, "0");
  return `${formatTarih(tarih)}, ${saat}:${dakika}`;
}

// "30 Eki"
export function formatKisa(tarih: Date): string {
  const d = istanbulaKaydir(tarih);
  return `${d.getUTCDate()} ${AYLAR_KISA[d.getUTCMonth()]}`;
}

export function formatGunAdi(tarih: Date): string {
  return GUNLER[istanbulaKaydir(tarih).getUTCDay()];
}

export function formatAyYil(yil: number, ay: number): string {
  return `${AYLAR[ay - 1]} ${yil}`;
}

// İstanbul takvim günü olarak "YYYY-MM-DD" — karşılaştırma ve gruplama anahtarı.
export function gunAnahtari(tarih: Date): string {
  const d = istanbulaKaydir(tarih);
  const ay = String(d.getUTCMonth() + 1).padStart(2, "0");
  const gun = String(d.getUTCDate()).padStart(2, "0");
  return `${d.getUTCFullYear()}-${ay}-${gun}`;
}

// §4.5: Geri sayım SUNUCU zaman damgasından hesaplanır, istemci saatine
// güvenilmez. `simdi` parametresi bu yüzden zorunlu — çağıran, sunucudan
// gelen "şu an"ı geçirir.
export function kalanGun(hedef: Date, simdi: Date): string {
  const hedefGun = gunAnahtari(hedef);
  const bugun = gunAnahtari(simdi);

  if (hedefGun === bugun) return "Bugün";

  const fark = Math.round(
    (Date.parse(`${hedefGun}T00:00:00Z`) - Date.parse(`${bugun}T00:00:00Z`)) / 86_400_000,
  );

  if (fark === 1) return "Yarın";
  if (fark === -1) return "Dün";
  if (fark < 0) return `${Math.abs(fark)} gün önce`;
  return `${fark} gün kaldı`;
}

// Gün sayısı — rozet/eşik mantığı için (ör. kayan şeritte 7 gün filtresi).
export function kalanGunSayisi(hedef: Date, simdi: Date): number {
  return Math.round(
    (Date.parse(`${gunAnahtari(hedef)}T00:00:00Z`) - Date.parse(`${gunAnahtari(simdi)}T00:00:00Z`)) /
      86_400_000,
  );
}
