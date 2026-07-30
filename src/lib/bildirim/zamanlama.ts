import { createHash } from "node:crypto";

// §4.8: "pg-boss günlük planlayıcı (06:00), gönderim 08:00 ±15 dk rastgele."
//
// Buradaki her şey saf fonksiyon — sistemin en kırılgan yeri (§4.8) olduğu
// için zamanlama mantığı DB'den ve pg-boss'tan bağımsız test edilebilir
// olmalı.

// §2: tüm zamanlar DB'de UTC, arayüzde Europe/Istanbul (UTC+3 sabit,
// Türkiye'de yaz saati uygulaması yok).
const ISTANBUL_OFSET_DK = 3 * 60;

export const GONDERIM_SAATI = 8; // İstanbul saatiyle
export const SACILMA_DK = 15; // ±

/** Bir UTC anının İstanbul'daki takvim gününü YYYY-MM-DD olarak verir. */
export function istanbulGunu(an: Date): string {
  return new Date(an.getTime() + ISTANBUL_OFSET_DK * 60_000).toISOString().slice(0, 10);
}

/** YYYY-MM-DD + gün → YYYY-MM-DD (UTC takvim aritmetiği). */
export function gunEkle(gun: string, ekle: number): string {
  const d = new Date(`${gun}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + ekle);
  return d.toISOString().slice(0, 10);
}

/**
 * Gönderim anı: İstanbul'da 08:00, ±15 dakika saçılmayla.
 *
 * Saçılma **rastgele değil, anahtardan türetilir**. Planlayıcı aynı gün
 * ikinci kez çalışırsa (yeniden başlatma, tarih değişikliği sonrası yeniden
 * planlama) aynı kayıt için aynı anı üretmeli — rastgele olsaydı `planlanan`
 * her çalıştırmada kayar, "iki kez gönderdik mi?" sorusu cevaplanamaz hâle
 * gelirdi.
 */
export function gonderimAni(gun: string, anahtar: string): Date {
  const temel = new Date(`${gun}T00:00:00.000Z`);
  // İstanbul 08:00 = UTC 05:00
  temel.setUTCHours(GONDERIM_SAATI, 0, 0, 0);
  temel.setUTCMinutes(temel.getUTCMinutes() - ISTANBUL_OFSET_DK);

  // Anahtarın ilk 4 baytı → [-15, +15] dakika.
  const ozet = createHash("sha256").update(anahtar).digest();
  const ham = ozet.readUInt32BE(0);
  const kayma = (ham % (SACILMA_DK * 2 + 1)) - SACILMA_DK;

  return new Date(temel.getTime() + kayma * 60_000);
}

/** Gönderim anahtarının tek tanımı — UNIQUE(abonelikId, ilanId, ofset) ile aynı üçlü. */
export function gonderimAnahtari(abonelikId: string, ilanId: string, ofset: number): string {
  return `${abonelikId}:${ilanId}:${ofset}`;
}

/**
 * Bugün planlanacak (sınav tarihi, ofset) çiftleri.
 *
 * Ofset "kaç gün önce" demek: 3 → bugünden 3 gün sonraki sınav. 0 → bugünkü.
 */
export function hedefGunler(bugun: string, ofsetler: number[]): { ofset: number; gun: string }[] {
  return [...new Set(ofsetler)]
    .sort((a, b) => b - a)
    .map((ofset) => ({ ofset, gun: gunEkle(bugun, ofset) }));
}

/**
 * İki `@db.Date` değeri farklı GÜN mü?
 *
 * `tarih-degisikligi.ts` yerine burada: orası `server-only` işaretli ve bu
 * saf karşılaştırma DB'siz test edilebilmeli.
 */
export function tarihDegistiMi(eski: Date | null, yeni: Date | null): boolean {
  if (!eski || !yeni) return false;
  return eski.toISOString().slice(0, 10) !== yeni.toISOString().slice(0, 10);
}
