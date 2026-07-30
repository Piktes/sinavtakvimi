// §8 Adım 1: statik referans verisi — kurum tipleri, etiketler (GRUP/DÜZEY/
// FORMAT), 45+ kurum, varsayılan koleksiyonlar, ilk admin hesabı.
// Demo ilanlar ayrı dosyada (prisma/seed-demo.ts, §8 Adım 3).
//
// Idempotent: upsert kullanır, tekrar çalıştırmak veri çoğaltmaz.

import argon2 from "argon2";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.ts";
import type { EtiketTipi } from "../src/generated/prisma/enums.ts";
import { slugla } from "../src/lib/slug.ts";
import { BOS_FILTRE } from "../src/lib/validations/koleksiyon.ts";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// §2: seed listesi. Admin panelden yeni tip eklenebilir (enum değil).
const kurumTipleri = [
  "Yayınevi",
  "Dershane/Kurs",
  "Kitabevi/Dağıtıcı",
  "Birlik/Dernek",
  "Bakanlık",
  "Üniversite/Kurum",
];

// §2: tek taksonomi tablosu, `tip` ile ayrılır.
const etiketler: { tip: EtiketTipi; ad: string; kisaAd?: string }[] = [
  // GRUP — üst menüde ve ilan sınıflandırmasında kullanılan ana kırılım.
  ...[
    "YKS",
    "LGS",
    "11. Sınıf",
    "10. Sınıf",
    "9. Sınıf",
    "8. Sınıf",
    "7. Sınıf",
    "6. Sınıf",
    "5. Sınıf",
    "4. Sınıf",
    "KPSS",
    "TUS",
    "DUS",
    "YDS",
    "Bursluluk",
  ].map((ad) => ({ tip: "GRUP" as const, ad })),

  // DUZEY — kullanıcının kalıcı düzey seçimi (§4.2) bu listeden gelir.
  ...[
    "4. Sınıf",
    "5. Sınıf",
    "6. Sınıf",
    "7. Sınıf",
    "8. Sınıf",
    "9. Sınıf",
    "10. Sınıf",
    "11. Sınıf",
    "12. Sınıf",
    "Lise Mezunu",
    "Lisans Mezunu",
    "Tıp Mezunu",
    "Diş Hekimliği Mezunu",
    "Öğretmen Adayı",
  ].map((ad) => ({ tip: "DUZEY" as const, ad })),

  // FORMAT — içerik tipi.
  ...[
    "TYT",
    "AYT",
    "TYT-AYT",
    "MSÜ",
    "LGS",
    "Branş",
    "Karma",
    "Gelişim İzleme",
    "Seviye Belirleme",
    "Bursluluk",
    "Kazanım",
  ].map((ad) => ({ tip: "FORMAT" as const, ad })),
];

// §0: 45+ yayınevi. Logolar yok — admin panelden yüklenecek (§6).
const kurumlar: { ad: string; tip: string }[] = [
  ...[
    "Özdebir",
    "Paraf",
    "Toprak",
    "Limit",
    "Limit Aktör",
    "Bilgi Sarmal",
    "Apotemi",
    "3D",
    "Elit Karma",
    "KR",
    "KR Twins",
    "VİP",
    "Paylaşım",
    "Format",
    "Sıfır Pozitif",
    "Yanıt",
    "Acil",
    "Orijinal",
    "Mikro Orijinal",
    "Kafa Dengi",
    "Metin",
    "Aday",
    "Ergi",
    "345",
    "Barış",
    "Strateji",
    "Benim Hocam",
    "IQ Gölge",
    "Karekök",
    "Mert Hoca",
    "EN Deneme",
    "Zeduva",
    "Aktif Öğrenme Prime",
    "Krallar Karması",
    "Çap",
    "Hız ve Renk",
    "Biyotik",
    "Orbital",
    "eduShare",
    "Ulti",
    "Branşlar Karması",
    "İlyas Güneş",
    "Ders Marketi",
  ].map((ad) => ({ ad, tip: "yayinevi" })),
  ...["Çözüm Eğitim Kurumları", "Özder"].map((ad) => ({ ad, tip: "dershane-kurs" })),
  { ad: "İşler Kitabevleri", tip: "kitabevi-dagitici" },
  { ad: "TÖDER", tip: "birlik-dernek" },
];

async function kurumTipleriniYaz(): Promise<Map<string, string>> {
  const harita = new Map<string, string>();
  for (const [sira, ad] of kurumTipleri.entries()) {
    const slug = slugla(ad);
    const kayit = await prisma.kurumTipi.upsert({
      where: { slug },
      update: { ad, sira },
      create: { ad, slug, sira },
    });
    harita.set(slug, kayit.id);
  }
  console.log(`${kurumTipleri.length} kurum tipi.`);
  return harita;
}

async function etiketleriYaz(): Promise<Map<string, string>> {
  // Anahtar: "TIP:slug" — GRUP ve DUZEY'de aynı slug'lar var ("11-sinif").
  const harita = new Map<string, string>();
  const sayaclar: Record<string, number> = { GRUP: 0, DUZEY: 0, FORMAT: 0 };

  for (const etiket of etiketler) {
    const slug = slugla(etiket.ad);
    const sira = sayaclar[etiket.tip]++;
    const kayit = await prisma.etiket.upsert({
      where: { tip_slug: { tip: etiket.tip, slug } },
      update: { ad: etiket.ad, kisaAd: etiket.kisaAd ?? null, sira },
      create: { tip: etiket.tip, ad: etiket.ad, slug, kisaAd: etiket.kisaAd ?? null, sira },
    });
    harita.set(`${etiket.tip}:${slug}`, kayit.id);
  }
  console.log(
    `${etiketler.length} etiket (GRUP ${sayaclar.GRUP}, DUZEY ${sayaclar.DUZEY}, FORMAT ${sayaclar.FORMAT}).`,
  );
  return harita;
}

async function kurumlariYaz(tipHaritasi: Map<string, string>): Promise<void> {
  for (const [sira, kurum] of kurumlar.entries()) {
    const slug = slugla(kurum.ad);
    const tipId = tipHaritasi.get(kurum.tip);
    if (!tipId) throw new Error(`Kurum tipi bulunamadı: ${kurum.tip}`);
    await prisma.kurum.upsert({
      where: { slug },
      update: { ad: kurum.ad, tipId, sira },
      create: { ad: kurum.ad, slug, tipId, sira },
    });
  }
  console.log(`${kurumlar.length} kurum.`);
}

// §4.2/§4.6: üst menü sekmeleri = kayıtlı filtreler. GRUP bazlı olanlar
// grupIds, sınıf sekmeleri duzeyIds ile kurulur.
async function koleksiyonlariYaz(etiketHaritasi: Map<string, string>): Promise<void> {
  const grup = (slug: string) => ({
    ...BOS_FILTRE,
    grupIds: [zorunlu(etiketHaritasi, `GRUP:${slug}`)],
  });
  const duzey = (slug: string) => ({
    ...BOS_FILTRE,
    duzeyIds: [zorunlu(etiketHaritasi, `DUZEY:${slug}`)],
  });

  const koleksiyonlar: { ad: string; filtre: ReturnType<typeof grup>; ikon?: string }[] = [
    { ad: "YKS", filtre: grup("yks") },
    { ad: "LGS", filtre: grup("lgs") },
    { ad: "11. Sınıf", filtre: duzey("11-sinif") },
    { ad: "10. Sınıf", filtre: duzey("10-sinif") },
    { ad: "9. Sınıf", filtre: duzey("9-sinif") },
    { ad: "8. Sınıf", filtre: duzey("8-sinif") },
    { ad: "7. Sınıf", filtre: duzey("7-sinif") },
    { ad: "6. Sınıf", filtre: duzey("6-sinif") },
    { ad: "5. Sınıf", filtre: duzey("5-sinif") },
    { ad: "4. Sınıf", filtre: duzey("4-sinif") },
    { ad: "KPSS", filtre: grup("kpss") },
    { ad: "TUS", filtre: grup("tus") },
    { ad: "DUS", filtre: grup("dus") },
    { ad: "YDS", filtre: grup("yds") },
  ];

  for (const [sira, koleksiyon] of koleksiyonlar.entries()) {
    const slug = slugla(koleksiyon.ad);
    await prisma.koleksiyon.upsert({
      where: { slug },
      update: { ad: koleksiyon.ad, sira, filtre: koleksiyon.filtre },
      create: { ad: koleksiyon.ad, slug, sira, filtre: koleksiyon.filtre },
    });
  }
  console.log(`${koleksiyonlar.length} koleksiyon.`);
}

function zorunlu(harita: Map<string, string>, anahtar: string): string {
  const deger = harita.get(anahtar);
  if (!deger) throw new Error(`Etiket bulunamadı: ${anahtar}`);
  return deger;
}

// §6: ilk kurulum admin hesabı. Kimlik bilgileri .env'den okunur, kodda sabit
// hiçbir şifre yok. İlk girişte şifre değiştirme zorunlu.
async function adminYaz(): Promise<void> {
  const eposta = process.env.SEED_ADMIN_EMAIL;
  const sifre = process.env.SEED_ADMIN_PASSWORD;

  if (!eposta || !sifre) {
    console.log("SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD yok — admin atlandı.");
    return;
  }

  await prisma.kullanici.upsert({
    where: { eposta },
    update: {},
    create: {
      eposta,
      sifreHash: await argon2.hash(sifre, { type: argon2.argon2id }),
      takmaAd: "Yönetici",
      epostaDogrulandi: true,
      yasBeyani13Ustu: true,
      rol: "ADMIN",
      sifreDegistirmeZorunlu: true,
    },
  });
  console.log(`Admin hazır: ${eposta}`);
}

// §5: aktif versiyon Ayar tablosundan okunur (`?tema=v2` ile önizlenir).
// §6 "Görünüm" ekranı bu satırı düzenleyecek.
async function ayarlariYaz(): Promise<void> {
  await prisma.ayar.upsert({
    where: { anahtar: "aktif_versiyon" },
    update: {},
    create: { anahtar: "aktif_versiyon", deger: "v1", grup: "gorunum" },
  });
  console.log("Ayarlar hazır (aktif_versiyon).");
}

async function main() {
  const tipHaritasi = await kurumTipleriniYaz();
  const etiketHaritasi = await etiketleriYaz();
  await kurumlariYaz(tipHaritasi);
  await koleksiyonlariYaz(etiketHaritasi);
  await ayarlariYaz();
  await adminYaz();
}

main()
  .catch((hata) => {
    console.error(hata);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
