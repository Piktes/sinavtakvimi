// §8 Adım 3: 60 demo ilan — genel siteyi (Adım 4) gerçekçi veriyle
// geliştirebilmek için. "Veri modelini bitirip aylarca ekran görmemek yerine,
// üçüncü adımda demo veriyle dördüncü adımda gösterilebilir çıktı alınır."
//
// Tarihler ÇALIŞTIRILDIĞI GÜNE GÖRE üretilir: birkaç ilan önümüzdeki 7 gün
// içine düşer (kayan şerit hep dolu olsun, §4.5), gerisi sezon sonuna kadar
// yayılır. Sabit tarih yazılsaydı seed bir yıl sonra çalıştırıldığında tüm
// ilanlar geçmişte kalır ve site boş görünürdü.
//
// Idempotent: slug üzerinden upsert.

// Doğrudan `tsx` ile çalıştırıldığı için .env'i kendisi yükler
// (prisma/seed.ts'i `prisma db seed` çalıştırdığından orada prisma.config.ts
// bu işi görüyor).
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.ts";
import type { UygulamaTipi, Zorluk } from "../src/generated/prisma/enums.ts";
import { sezonTuret } from "../src/lib/sezon.ts";
import { slugla } from "../src/lib/slug.ts";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

interface OturumTasarimi {
  ad: string;
  saat: string;
  sureDk: number;
  soruSayisi: number;
}

interface SeriTasarimi {
  kurum: string;
  dagitici?: string;
  grup: string;
  format: string;
  duzeyler: string[];
  ad: string;
  uygulamaTipi: UygulamaTipi;
  zorluk?: Zorluk;
  adet: number;
  oturumlar?: OturumTasarimi[];
  // Sınav birden çok güne yayılıyorsa (ör. "9–12 Ekim") kaç gün sürdüğü.
  gunSayisi?: number;
  saat?: string;
}

const TYT_AYT_OTURUMLARI: OturumTasarimi[] = [
  { ad: "TYT", saat: "09:45", sureDk: 165, soruSayisi: 120 },
  { ad: "AYT", saat: "14:30", sureDk: 180, soruSayisi: 160 },
];

const TYT_OTURUMLARI: OturumTasarimi[] = [
  { ad: "TYT", saat: "09:45", sureDk: 165, soruSayisi: 120 },
];

const LGS_OTURUMLARI: OturumTasarimi[] = [
  { ad: "Sözel", saat: "09:30", sureDk: 75, soruSayisi: 50 },
  { ad: "Sayısal", saat: "11:30", sureDk: 80, soruSayisi: 40 },
];

// §0'daki gerçek veri örneklerine dayanan seriler.
const seriler: SeriTasarimi[] = [
  {
    kurum: "Özdebir",
    grup: "YKS",
    format: "TYT-AYT",
    duzeyler: ["12. Sınıf", "Lise Mezunu"],
    ad: "Özdebir TYT-AYT Denemesi",
    uygulamaTipi: "TURKIYE_GENELI",
    zorluk: "ORTA",
    adet: 8,
    oturumlar: TYT_AYT_OTURUMLARI,
    gunSayisi: 3,
  },
  {
    kurum: "Paraf",
    grup: "YKS",
    format: "TYT",
    duzeyler: ["11. Sınıf", "12. Sınıf"],
    ad: "Paraf TYT Denemesi",
    uygulamaTipi: "TURKIYE_GENELI",
    zorluk: "ORTA",
    adet: 6,
    oturumlar: TYT_OTURUMLARI,
    gunSayisi: 2,
  },
  {
    kurum: "Mikro Orijinal",
    dagitici: "İşler Kitabevleri",
    grup: "YKS",
    format: "TYT",
    duzeyler: ["12. Sınıf", "Lise Mezunu"],
    ad: "Mikro Orijinal TYT Denemesi",
    uygulamaTipi: "TURKIYE_GENELI",
    zorluk: "ZOR",
    adet: 5,
    oturumlar: TYT_OTURUMLARI,
    gunSayisi: 4,
  },
  {
    kurum: "Bilgi Sarmal",
    grup: "YKS",
    format: "AYT",
    duzeyler: ["12. Sınıf", "Lise Mezunu"],
    ad: "Bilgi Sarmal AYT Denemesi",
    uygulamaTipi: "TURKIYE_GENELI",
    zorluk: "ZOR",
    adet: 5,
    oturumlar: [{ ad: "AYT", saat: "14:30", sureDk: 180, soruSayisi: 160 }],
  },
  {
    kurum: "Apotemi",
    grup: "YKS",
    format: "Branş",
    duzeyler: ["11. Sınıf", "12. Sınıf"],
    ad: "Apotemi Matematik Branş Denemesi",
    uygulamaTipi: "TURKIYE_GENELI",
    zorluk: "ZOR",
    adet: 4,
    saat: "10:00",
  },
  {
    kurum: "Çözüm Eğitim Kurumları",
    grup: "11. Sınıf",
    format: "Gelişim İzleme",
    duzeyler: ["9. Sınıf", "10. Sınıf", "11. Sınıf"],
    ad: "CZM 9-10-11. Sınıf Gelişim İzleme Sınavı",
    uygulamaTipi: "KURUMSAL",
    zorluk: "ORTA",
    adet: 6,
    gunSayisi: 4,
  },
  {
    kurum: "Toprak",
    grup: "LGS",
    format: "LGS",
    duzeyler: ["8. Sınıf"],
    ad: "Toprak LGS Denemesi",
    uygulamaTipi: "TURKIYE_GENELI",
    zorluk: "ORTA",
    adet: 7,
    oturumlar: LGS_OTURUMLARI,
    gunSayisi: 2,
  },
  {
    kurum: "Bilgi Sarmal",
    grup: "LGS",
    format: "LGS",
    duzeyler: ["8. Sınıf"],
    ad: "Bilgi Sarmal LGS Denemesi",
    uygulamaTipi: "TURKIYE_GENELI",
    zorluk: "ZOR",
    adet: 4,
    oturumlar: LGS_OTURUMLARI,
  },
  {
    kurum: "Karekök",
    grup: "7. Sınıf",
    format: "Kazanım",
    duzeyler: ["7. Sınıf"],
    ad: "Karekök 7. Sınıf Kazanım Denemesi",
    uygulamaTipi: "TURKIYE_GENELI",
    zorluk: "KOLAY",
    adet: 4,
    saat: "10:00",
  },
  {
    kurum: "345",
    grup: "5. Sınıf",
    format: "Seviye Belirleme",
    duzeyler: ["4. Sınıf", "5. Sınıf"],
    ad: "345 Seviye Belirleme Sınavı",
    uygulamaTipi: "TURKIYE_GENELI",
    zorluk: "KOLAY",
    adet: 3,
    saat: "10:30",
  },
  {
    kurum: "Benim Hocam",
    grup: "KPSS",
    format: "Karma",
    duzeyler: ["Lisans Mezunu", "Öğretmen Adayı"],
    ad: "Benim Hocam KPSS Genel Deneme",
    uygulamaTipi: "TURKIYE_GENELI",
    zorluk: "ORTA",
    adet: 5,
    gunSayisi: 3,
  },
  {
    kurum: "Aday",
    grup: "TUS",
    format: "Karma",
    duzeyler: ["Tıp Mezunu"],
    ad: "Aday TUS Denemesi",
    uygulamaTipi: "TURKIYE_GENELI",
    zorluk: "ZOR",
    adet: 3,
  },
  {
    kurum: "Ergi",
    grup: "DUS",
    format: "Karma",
    duzeyler: ["Diş Hekimliği Mezunu"],
    ad: "Ergi DUS Denemesi",
    uygulamaTipi: "TURKIYE_GENELI",
    zorluk: "ZOR",
    adet: 2,
  },
  {
    kurum: "Format",
    grup: "YDS",
    format: "Karma",
    duzeyler: ["Lisans Mezunu"],
    ad: "Format YDS Denemesi",
    uygulamaTipi: "TURKIYE_GENELI",
    zorluk: "ORTA",
    adet: 2,
  },
  {
    kurum: "Özder",
    grup: "Bursluluk",
    format: "Bursluluk",
    duzeyler: ["7. Sınıf", "8. Sınıf"],
    ad: "Özder Bursluluk Sınavı",
    uygulamaTipi: "KURUMSAL",
    zorluk: "ORTA",
    adet: 2,
    saat: "10:00",
  },
];

// UTC gece yarısı — @db.Date sütunları için (saat bilgisi ayrı alanda).
function gunEkle(temel: Date, gun: number): Date {
  const d = new Date(temel);
  d.setUTCDate(d.getUTCDate() + gun);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function saatliZaman(gun: Date, saat: number, dakika: number): Date {
  const d = new Date(gun);
  // Girilen saat Europe/Istanbul kabul edilir; DB'ye UTC yazılır (§2).
  d.setUTCHours(saat - 3, dakika, 0, 0);
  return d;
}

async function main() {
  const bugun = new Date();
  bugun.setUTCHours(0, 0, 0, 0);

  const [kurumlar, etiketler] = await Promise.all([
    prisma.kurum.findMany({ select: { id: true, ad: true } }),
    prisma.etiket.findMany({ select: { id: true, ad: true, tip: true } }),
  ]);

  const kurumHaritasi = new Map(kurumlar.map((k) => [k.ad, k.id]));
  const etiketHaritasi = new Map(etiketler.map((e) => [`${e.tip}:${e.ad}`, e.id]));

  const kurumId = (ad: string) => {
    const id = kurumHaritasi.get(ad);
    if (!id) throw new Error(`Kurum yok: ${ad} — önce prisma/seed.ts çalıştırın.`);
    return id;
  };
  const etiketId = (tip: string, ad: string) => {
    const id = etiketHaritasi.get(`${tip}:${ad}`);
    if (!id) throw new Error(`Etiket yok: ${tip}:${ad} — önce prisma/seed.ts çalıştırın.`);
    return id;
  };

  // Tüm ilanlar TEK sezona sığar (§8: "Eylül 2026 – Haziran 2027" ölçeğinde
  // ~10 aylık pencere). İlk 6 serinin ilk ilanı önümüzdeki 7 güne düşer ki
  // kayan şerit dolu olsun; kalanlar pencereye eşit aralıklarla yayılır.
  // Seriler arası kaydırma, hepsinin aynı güne yığılmasını önler.
  const PENCERE_SONU = 300;
  const YAKIN_OFSETLER = [1, 2, 3, 4, 5, 6];

  let yakinIndeks = 0;
  let sayac = 0;

  for (const [seriIndeks, seri] of seriler.entries()) {
    const yakinOfset = yakinIndeks < YAKIN_OFSETLER.length ? YAKIN_OFSETLER[yakinIndeks++] : null;
    // Yakın slot kullanılmışsa geri kalanlar 21. günden sonra başlar. Seriler
    // farklı günlerde başlasın diye ayrıca kaydırılır — yoksa hepsinin ilk
    // yayılan ilanı aynı haftaya yığılıyor.
    const kaydirma = (seriIndeks * 13) % 45;
    const yayilmaBaslangici = (yakinOfset === null ? 14 : 21) + kaydirma;
    const yayilacakAdet = yakinOfset === null ? seri.adet : seri.adet - 1;
    const adim = yayilacakAdet > 0 ? (PENCERE_SONU - yayilmaBaslangici) / yayilacakAdet : 0;

    for (let no = 1; no <= seri.adet; no += 1) {
      let ofset: number;
      if (yakinOfset !== null && no === 1) {
        ofset = yakinOfset;
      } else {
        const sira = yakinOfset === null ? no - 1 : no - 2;
        ofset = Math.round(yayilmaBaslangici + sira * adim) + (seriIndeks % 7);
      }

      const sinavTarihi = gunEkle(bugun, ofset);
      const sinavBitisTarihi =
        seri.gunSayisi && seri.gunSayisi > 1 ? gunEkle(sinavTarihi, seri.gunSayisi - 1) : null;

      const baslik = `${seri.ad} ${String(no).padStart(2, "0")}`;
      const slug = slugla(`${baslik}-${sezonTuret(sinavTarihi)}`);

      const veri = {
        baslik,
        seriNo: no,
        kurumId: kurumId(seri.kurum),
        dagiticiKurumId: seri.dagitici ? kurumId(seri.dagitici) : null,
        grupId: etiketId("GRUP", seri.grup),
        formatId: etiketId("FORMAT", seri.format),
        sinavTarihi,
        sinavBitisTarihi,
        saat: seri.saat ?? seri.oturumlar?.[0]?.saat ?? null,
        // Son sipariş sınavdan ~2 hafta önce, cevap anahtarı sınav akşamı 20:00.
        sonSiparisTarihi: gunEkle(sinavTarihi, -14),
        cevapAnahtariZamani: saatliZaman(sinavBitisTarihi ?? sinavTarihi, 20, 0),
        uygulamaTipi: seri.uygulamaTipi,
        zorluk: seri.zorluk ?? null,
        sezon: sezonTuret(sinavTarihi),
        // Her serinin ilk ilanı öne çıkarılır — ana sayfa bloğu boş kalmasın.
        oneCikar: no === 1,
        yayinDurumu: "YAYINDA" as const,
      };

      const ilan = await prisma.ilan.upsert({
        where: { slug },
        update: veri,
        create: {
          ...veri,
          slug,
          duzeyler: { connect: seri.duzeyler.map((ad) => ({ id: etiketId("DUZEY", ad) })) },
        },
      });

      // Oturumlar "kaydet tek seferde alt kayıtları değiştirir" mantığıyla
      // yeniden yazılır — seed tekrar çalıştığında çoğalmaz.
      await prisma.oturum.deleteMany({ where: { ilanId: ilan.id } });
      if (seri.oturumlar?.length) {
        await prisma.oturum.createMany({
          data: seri.oturumlar.map((oturum, sira) => ({
            ilanId: ilan.id,
            ad: oturum.ad,
            saat: oturum.saat,
            sureDk: oturum.sureDk,
            soruSayisi: oturum.soruSayisi,
            sira,
          })),
        });
      }

      sayac += 1;
    }
  }

  console.log(`${sayac} demo ilan upsert edildi.`);
}

main()
  .catch((hata) => {
    console.error(hata);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
