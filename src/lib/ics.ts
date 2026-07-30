// §4.7: "Takvime ekle — Google Takvim şablon bağlantısı + .ics indirme.
// OAuth yok. Ek olarak abone olunabilir akışlar: /api/ics/koleksiyon/[slug].ics,
// /api/ics/yayinevi/[slug].ics — kullanıcı bir kez ekler, tarih değişince
// takvimi kendiliğinden güncellenir."
//
// Bağımlılık eklemiyoruz: RFC 5545'in ihtiyacımız olan kısmı (VEVENT +
// tüm-gün DATE değerleri) yüz satırdan kısa ve kaçış kuralları kapalı bir küme.
// csv.ts'teki gerekçenin aynısı.

export interface IcsOlayi {
  /** Takvim uygulamasının aynı olayı güncelleme olarak tanıması için kalıcı olmalı. */
  uid: string;
  baslik: string;
  /** Salt tarih; sınavlar tüm-gün olay olarak yazılır (§2: saat serbest metin). */
  baslangic: Date;
  /** Dahil son gün. Yoksa tek günlük olay. */
  bitis?: Date | null;
  aciklama?: string | null;
  url?: string | null;
  /** Değişiklikte artar; takvim istemcisi hangi sürümün yeni olduğunu bundan bilir. */
  sira?: number;
  guncellenme?: Date;
}

// RFC 5545 §3.3.11: ters bölü, noktalı virgül, virgül ve satır sonu kaçışlanır.
// Ters bölü ilk sırada olmalı, yoksa kendi eklediklerimizi tekrar kaçışlarız.
function metniKacisla(deger: string): string {
  return deger
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

// RFC 5545 §3.1: satırlar 75 oktetten uzun olamaz; devam satırları tek boşlukla
// başlar. UTF-8'de bir karakter birden çok oktet olabildiği için bayt sayarız —
// Türkçe başlıklarda "ğ" 2 bayt, karakter sayarsak sınırı aşarız.
function satiriKatla(satir: string): string {
  const baytlar = Buffer.from(satir, "utf8");
  if (baytlar.length <= 75) return satir;

  const parcalar: string[] = [];
  let ofset = 0;
  let sinir = 75;

  while (ofset < baytlar.length) {
    let uzunluk = Math.min(sinir, baytlar.length - ofset);

    // Çok baytlı karakterin ortasından bölmemek için geri çekil:
    // UTF-8 devam baytları 10xxxxxx desenindedir.
    while (uzunluk > 1 && (baytlar[ofset + uzunluk] & 0xc0) === 0x80) uzunluk -= 1;

    parcalar.push(baytlar.subarray(ofset, ofset + uzunluk).toString("utf8"));
    ofset += uzunluk;
    sinir = 74; // devam satırlarında baştaki boşluk da sayılır
  }

  return parcalar.join("\r\n ");
}

/**
 * Tüm-gün olaylar için DATE biçimi (YYYYMMDD).
 *
 * `sinavTarihi` bir `@db.Date` sütunu; Prisma bunu UTC gece yarısı olarak
 * okur, dolayısıyla takvim günü doğrudan `getUTC*` alanlarındadır. Burada
 * saat dilimi kaydırması YAPILMAZ — tarih.ts'in +3 saatlik kaydırması
 * gece yarısına eklendiğinde günü değiştirmediği için sonuç aynı, ama
 * ICS tarafında ham değeri kullanmak niyeti daha açık gösteriyor.
 */
function tarihDegeri(tarih: Date): string {
  return [
    tarih.getUTCFullYear(),
    String(tarih.getUTCMonth() + 1).padStart(2, "0"),
    String(tarih.getUTCDate()).padStart(2, "0"),
  ].join("");
}

/** UTC damgası (YYYYMMDDTHHMMSSZ) — DTSTAMP/LAST-MODIFIED için. */
export function zamanDamgasi(tarih: Date): string {
  return `${tarihDegeri(tarih)}T${[
    String(tarih.getUTCHours()).padStart(2, "0"),
    String(tarih.getUTCMinutes()).padStart(2, "0"),
    String(tarih.getUTCSeconds()).padStart(2, "0"),
  ].join("")}Z`;
}

function gunEkle(tarih: Date, gun: number): Date {
  return new Date(tarih.getTime() + gun * 24 * 60 * 60 * 1000);
}

export function icsUret(
  olaylar: IcsOlayi[],
  secenekler: { takvimAdi: string; aciklama?: string; simdi?: Date } = {
    takvimAdi: "Sınav Takvimi",
  },
): string {
  const simdi = secenekler.simdi ?? new Date();
  const satirlar: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Sinav Ilan Platformu//TR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${metniKacisla(secenekler.takvimAdi)}`,
    "X-WR-TIMEZONE:Europe/Istanbul",
    // Abone olunabilir akışlarda istemciye yenileme aralığı önerisi.
    "REFRESH-INTERVAL;VALUE=DURATION:PT12H",
    "X-PUBLISHED-TTL:PT12H",
  ];

  if (secenekler.aciklama) {
    satirlar.push(`X-WR-CALDESC:${metniKacisla(secenekler.aciklama)}`);
  }

  for (const olay of olaylar) {
    // DTEND tüm-gün olaylarda DIŞLAYICIDIR: 12 Nisan'da biten sınav için
    // 13 Nisan yazılır, yoksa takvimde bir gün eksik görünür.
    const bitisDisla = gunEkle(olay.bitis ?? olay.baslangic, 1);

    satirlar.push(
      "BEGIN:VEVENT",
      `UID:${olay.uid}`,
      `DTSTAMP:${zamanDamgasi(simdi)}`,
      `DTSTART;VALUE=DATE:${tarihDegeri(olay.baslangic)}`,
      `DTEND;VALUE=DATE:${tarihDegeri(bitisDisla)}`,
      `SUMMARY:${metniKacisla(olay.baslik)}`,
      `SEQUENCE:${olay.sira ?? 0}`,
      "TRANSP:TRANSPARENT",
      "STATUS:CONFIRMED",
    );

    if (olay.guncellenme) satirlar.push(`LAST-MODIFIED:${zamanDamgasi(olay.guncellenme)}`);
    if (olay.aciklama) satirlar.push(`DESCRIPTION:${metniKacisla(olay.aciklama)}`);
    if (olay.url) satirlar.push(`URL:${metniKacisla(olay.url)}`);

    satirlar.push("END:VEVENT");
  }

  satirlar.push("END:VCALENDAR");

  // RFC 5545 §3.1: satır sonu CRLF, dosya CRLF ile biter.
  return `${satirlar.map(satiriKatla).join("\r\n")}\r\n`;
}

/**
 * §4.7: OAuth gerektirmeyen Google Takvim şablon bağlantısı. Kullanıcı zaten
 * girişli olduğu kendi hesabında formu görür; biz hiçbir izin istemeyiz.
 */
export function googleTakvimBaglantisi(olay: {
  baslik: string;
  baslangic: Date;
  bitis?: Date | null;
  aciklama?: string | null;
  url?: string | null;
}): string {
  const bitisDisla = gunEkle(olay.bitis ?? olay.baslangic, 1);
  const ayrintilar = [olay.aciklama, olay.url].filter(Boolean).join("\n\n");

  const parametreler = new URLSearchParams({
    action: "TEMPLATE",
    text: olay.baslik,
    dates: `${tarihDegeri(olay.baslangic)}/${tarihDegeri(bitisDisla)}`,
    ctz: "Europe/Istanbul",
  });
  if (ayrintilar) parametreler.set("details", ayrintilar);

  return `https://calendar.google.com/calendar/render?${parametreler.toString()}`;
}

/** UID kalıcı olmalı: aynı ilan her akışta aynı olayı temsil etsin. */
export function ilanUid(ilanId: string): string {
  return `ilan-${ilanId}@sinavilan`;
}
