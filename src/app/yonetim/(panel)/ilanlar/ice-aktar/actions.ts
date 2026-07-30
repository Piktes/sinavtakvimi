"use server";

import { revalidatePath } from "next/cache";
import { denetimYaz } from "@/lib/denetim";
import { csvNesneleriOku } from "@/lib/csv";
import {
  anahtarla,
  satiriCoz,
  type AramaTablolari,
  type CozulmusSatir,
  type SatirHatasi,
} from "@/lib/ice-aktarma/ilan-satiri";
import { ZORUNLU_SUTUNLAR } from "@/lib/ice-aktarma/ilan-sutunlari";
import { prisma } from "@/lib/prisma";
import { requireRol } from "@/lib/rbac";
import { slugla } from "@/lib/slug";

const ROLLER = ["ADMIN", "EDITOR"] as const;
const EN_FAZLA_SATIR = 1000;

export interface DogrulamaRaporu {
  hata?: string;
  eksikSutunlar?: string[];
  toplamSatir?: number;
  gecerli?: CozulmusSatir[];
  hatalar?: SatirHatasi[];
  // Aynı slug DB'de zaten varsa "çakışma" olarak ayrı gösterilir (§4.2).
  cakisanlar?: { satirNo: number; baslik: string }[];
}

async function aramaTablolariniGetir(): Promise<AramaTablolari> {
  const [kurumlar, etiketler] = await Promise.all([
    prisma.kurum.findMany({ select: { id: true, ad: true, slug: true } }),
    prisma.etiket.findMany({ select: { id: true, ad: true, slug: true, tip: true } }),
  ]);

  // Hem ada hem slug'a göre eşleşme: kullanıcı ikisini de yazmış olabilir.
  const kurumTablosu = new Map<string, string>();
  for (const kurum of kurumlar) {
    kurumTablosu.set(anahtarla(kurum.ad), kurum.id);
    kurumTablosu.set(anahtarla(kurum.slug), kurum.id);
  }

  const etiketTablosu = (tip: string) => {
    const tablo = new Map<string, string>();
    for (const etiket of etiketler.filter((e) => e.tip === tip)) {
      tablo.set(anahtarla(etiket.ad), etiket.id);
      tablo.set(anahtarla(etiket.slug), etiket.id);
    }
    return tablo;
  };

  return {
    kurumlar: kurumTablosu,
    gruplar: etiketTablosu("GRUP"),
    formatlar: etiketTablosu("FORMAT"),
    duzeyler: etiketTablosu("DUZEY"),
  };
}

// §4.2 birinci adım: dosya yüklenir, HİÇBİR ŞEY KAYDEDİLMEZ, yalnızca rapor
// üretilir. Kullanıcı raporu görüp onaylayınca ikinci adım çalışır.
export async function dosyayiDogrula(
  _oncekiDurum: DogrulamaRaporu | undefined,
  formData: FormData,
): Promise<DogrulamaRaporu> {
  await requireRol(ROLLER);

  const dosya = formData.get("dosya");
  if (!(dosya instanceof File) || dosya.size === 0) {
    return { hata: "Bir CSV dosyası seçin." };
  }
  if (dosya.size > 5 * 1024 * 1024) {
    return { hata: "Dosya 5 MB'tan büyük olamaz." };
  }

  const metin = await dosya.text();
  const { basliklar, satirlar } = csvNesneleriOku(metin);

  if (satirlar.length === 0) {
    return { hata: "Dosyada veri satırı bulunamadı." };
  }
  if (satirlar.length > EN_FAZLA_SATIR) {
    return { hata: `Tek seferde en fazla ${EN_FAZLA_SATIR} satır yüklenebilir.` };
  }

  const eksikSutunlar = ZORUNLU_SUTUNLAR.filter((sutun) => !basliklar.includes(sutun));
  if (eksikSutunlar.length > 0) {
    return {
      hata: "Dosyada zorunlu sütunlar eksik. Şablonu indirip başlık satırını koruyun.",
      eksikSutunlar,
    };
  }

  const tablolar = await aramaTablolariniGetir();

  const gecerli: CozulmusSatir[] = [];
  const hatalar: SatirHatasi[] = [];

  satirlar.forEach((satir, index) => {
    // Şablonun ilk satırı açıklama metnidir; kullanıcı silmediyse atlanır.
    if ((satir.baslik ?? "").startsWith("[ZORUNLU]")) return;

    // +2: başlık satırı ve 1 tabanlı numaralandırma — kullanıcının Excel'de
    // gördüğü satır numarasıyla aynı olsun.
    const sonuc = satiriCoz(satir, index + 2, tablolar);
    if (sonuc.veri) gecerli.push(sonuc.veri);
    hatalar.push(...sonuc.hatalar);
  });

  // Çakışma kontrolü: aynı slug DB'de var mı?
  const sluglar = gecerli.map((satir) => slugla(`${satir.baslik}-${satir.sezon}`));
  const mevcutlar = await prisma.ilan.findMany({
    where: { slug: { in: sluglar } },
    select: { slug: true },
  });
  const mevcutKume = new Set(mevcutlar.map((i) => i.slug));

  const cakisanlar = gecerli
    .map((satir, index) => ({ satir, slug: sluglar[index] }))
    .filter(({ slug }) => mevcutKume.has(slug))
    .map(({ satir }) => ({ satirNo: satir.satirNo, baslik: satir.baslik }));

  return {
    toplamSatir: satirlar.length,
    gecerli,
    hatalar,
    cakisanlar,
  };
}

export interface AktarmaSonucu {
  hata?: string;
  eklenen?: number;
}

// §4.2 ikinci adım: yalnızca GEÇERLİ satırlar, TASLAK olarak eklenir.
// "Hepsi taslak gelir" — admin gözden geçirip yayınlar.
export async function onaylananlariAktar(
  _oncekiDurum: AktarmaSonucu | undefined,
  formData: FormData,
): Promise<AktarmaSonucu> {
  const oturum = await requireRol(ROLLER);

  let satirlar: CozulmusSatir[];
  try {
    satirlar = JSON.parse((formData.get("gecerliJson") as string) || "[]");
  } catch {
    return { hata: "Aktarılacak satırlar okunamadı." };
  }
  if (satirlar.length === 0) return { hata: "Aktarılacak geçerli satır yok." };

  const cakisanlariAtla = formData.get("cakisanlariAtla") === "true";

  const gun = (deger: string) => new Date(`${deger}T00:00:00.000Z`);
  // Girilen saat Europe/Istanbul kabul edilir; DB'ye UTC yazılır.
  const zaman = (deger: string) => new Date(`${deger}:00.000+03:00`);

  let eklenen = 0;

  for (const satir of satirlar) {
    const temelSlug = slugla(`${satir.baslik}-${satir.sezon}`);

    let slug = temelSlug;
    const mevcut = await prisma.ilan.findUnique({ where: { slug }, select: { id: true } });
    if (mevcut) {
      if (cakisanlariAtla) continue;
      // Atlanmıyorsa yeni kayıt olarak eklenir, slug benzersizleştirilir.
      let sayac = 2;
      while (await prisma.ilan.findUnique({ where: { slug }, select: { id: true } })) {
        slug = `${temelSlug}-${sayac}`;
        sayac += 1;
      }
    }

    await prisma.ilan.create({
      data: {
        baslik: satir.baslik,
        slug,
        seriNo: satir.seriNo,
        kurumId: satir.kurumId,
        dagiticiKurumId: satir.dagiticiKurumId,
        grupId: satir.grupId,
        formatId: satir.formatId,
        sinavTarihi: gun(satir.sinavTarihi),
        sinavBitisTarihi: satir.sinavBitisTarihi ? gun(satir.sinavBitisTarihi) : null,
        saat: satir.saat,
        sonSiparisTarihi: satir.sonSiparisTarihi ? gun(satir.sonSiparisTarihi) : null,
        cevapAnahtariZamani: satir.cevapAnahtariZamani ? zaman(satir.cevapAnahtariZamani) : null,
        uygulamaTipi: satir.uygulamaTipi,
        zorluk: satir.zorluk,
        aciklamaMd: satir.aciklama,
        detayUrl: satir.detayUrl,
        sezon: satir.sezon,
        yayinDurumu: "TASLAK",
        olusturanId: oturum.kullaniciId,
        duzeyler: { connect: satir.duzeyIds.map((id) => ({ id })) },
      },
    });

    eklenen += 1;
  }

  await denetimYaz({
    adminId: oturum.kullaniciId,
    eylem: "OLUSTUR",
    varlik: "Ilan",
    varlikId: `ice-aktarma-${Date.now()}`,
    sonrasi: { kaynak: "CSV içe aktarma", eklenen },
  });

  revalidatePath("/yonetim/ilanlar");
  return { eklenen };
}
