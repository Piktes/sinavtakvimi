import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { filtreOku, type KoleksiyonFiltresi } from "@/lib/validations/koleksiyon";

// İstemciye geçen ilan şekli. Prisma modelini olduğu gibi göndermek yerine
// açık bir tip: Decimal/Date gibi serileştirilemeyen alanlar burada
// düzleştirilir ve istemci tarafı filtreleme (§4.3) bu şekle göre yazılır.
export interface IlanOzet {
  id: string;
  baslik: string;
  slug: string;
  seriNo: number | null;
  sinavTarihi: string;
  sinavBitisTarihi: string | null;
  saat: string | null;
  sonSiparisTarihi: string | null;
  cevapAnahtariZamani: string | null;
  uygulamaTipi: "TURKIYE_GENELI" | "KURUMSAL";
  il: string | null;
  zorluk: "KOLAY" | "ORTA" | "ZOR" | null;
  oneCikar: boolean;
  puanOrtalama: number | null;
  puanSayisi: number;
  kurum: { id: string; ad: string; slug: string; logoUrl: string | null };
  dagiticiKurum: { ad: string; slug: string } | null;
  grup: { id: string; ad: string; slug: string };
  format: { id: string; ad: string; slug: string };
  duzeyler: { id: string; ad: string; slug: string }[];
}

const ILAN_SECIMI = {
  id: true,
  baslik: true,
  slug: true,
  seriNo: true,
  sinavTarihi: true,
  sinavBitisTarihi: true,
  saat: true,
  sonSiparisTarihi: true,
  cevapAnahtariZamani: true,
  uygulamaTipi: true,
  il: true,
  zorluk: true,
  oneCikar: true,
  puanOrtalama: true,
  puanSayisi: true,
  kurum: { select: { id: true, ad: true, slug: true, logoUrl: true } },
  dagiticiKurum: { select: { ad: true, slug: true } },
  grup: { select: { id: true, ad: true, slug: true } },
  format: { select: { id: true, ad: true, slug: true } },
  duzeyler: { select: { id: true, ad: true, slug: true } },
} satisfies Prisma.IlanSelect;

type IlanSatiri = Prisma.IlanGetPayload<{ select: typeof ILAN_SECIMI }>;

// Date → ISO gün anahtarı. @db.Date sütunları UTC gece yarısı olarak gelir,
// dilim kaydırması yapılmadan doğrudan gün olarak yazılır.
function gun(tarih: Date | null): string | null {
  return tarih ? tarih.toISOString().slice(0, 10) : null;
}

function ozete(satir: IlanSatiri): IlanOzet {
  return {
    ...satir,
    sinavTarihi: gun(satir.sinavTarihi)!,
    sinavBitisTarihi: gun(satir.sinavBitisTarihi),
    sonSiparisTarihi: gun(satir.sonSiparisTarihi),
    cevapAnahtariZamani: satir.cevapAnahtariZamani?.toISOString() ?? null,
  };
}

// Koleksiyon filtresini (jsonb) Prisma where'ine çevirir. Boş dizi = o
// facette kısıt yok. Tek yerde çözülür — §4.3 ve §6 canlı önizleme aynı
// fonksiyonu kullanır, iki farklı yorum riski kalmaz.
export function filtreyiWhereCevir(filtre: KoleksiyonFiltresi): Prisma.IlanWhereInput {
  const where: Prisma.IlanWhereInput = {};

  if (filtre.grupIds.length) where.grupId = { in: filtre.grupIds };
  if (filtre.formatIds.length) where.formatId = { in: filtre.formatIds };
  if (filtre.kurumIds.length) where.kurumId = { in: filtre.kurumIds };
  if (filtre.duzeyIds.length) where.duzeyler = { some: { id: { in: filtre.duzeyIds } } };
  if (filtre.uygulamaTipi.length) where.uygulamaTipi = { in: filtre.uygulamaTipi };
  if (filtre.zorluk.length) where.zorluk = { in: filtre.zorluk };
  if (filtre.baslikIcerir) where.baslik = { contains: filtre.baslikIcerir, mode: "insensitive" };

  return where;
}

// Yalnızca yayında olanlar — taslak ve arşiv genel sitede görünmez.
const YAYINDA = { yayinDurumu: "YAYINDA" } as const;

// §4.3: "Aktif ay/aralığın ilanları sunucudan BİR KEZ gelir, filtreler
// istemcide uygulanır." Bu yüzden sorgu aya göre, filtreye göre değil.
export async function ayinIlanlari(
  yil: number,
  ay: number,
  ekFiltre?: Prisma.IlanWhereInput,
): Promise<IlanOzet[]> {
  // Ayın ilk ve son günü (UTC). Bitiş tarihi bir sonraki aya taşan ilanlar da
  // o ayın ızgarasında görünmeli, bu yüzden aralık örtüşmesi aranıyor.
  const ayinBasi = new Date(Date.UTC(yil, ay - 1, 1));
  const ayinSonu = new Date(Date.UTC(yil, ay, 0));

  const satirlar = await prisma.ilan.findMany({
    where: {
      ...YAYINDA,
      ...ekFiltre,
      OR: [
        { sinavTarihi: { gte: ayinBasi, lte: ayinSonu } },
        { sinavBitisTarihi: { gte: ayinBasi, lte: ayinSonu } },
        { AND: [{ sinavTarihi: { lt: ayinBasi } }, { sinavBitisTarihi: { gt: ayinSonu } }] },
      ],
    },
    select: ILAN_SECIMI,
    orderBy: [{ sinavTarihi: "asc" }, { baslik: "asc" }],
  });

  return satirlar.map(ozete);
}

// §4.5 kayan şerit: 7 gün içindeki ilanlar. Eşik parametrik — admin panelden
// yönetilecek (§6 "Görünüm: kayan şerit eşiği").
export async function yaklasanIlanlar(gunSayisi = 7, limit = 12): Promise<IlanOzet[]> {
  const bugun = new Date();
  bugun.setUTCHours(0, 0, 0, 0);
  const son = new Date(bugun);
  son.setUTCDate(son.getUTCDate() + gunSayisi);

  const satirlar = await prisma.ilan.findMany({
    where: { ...YAYINDA, sinavTarihi: { gte: bugun, lte: son } },
    select: ILAN_SECIMI,
    orderBy: [{ sinavTarihi: "asc" }, { baslik: "asc" }],
    take: limit,
  });

  return satirlar.map(ozete);
}

export async function ilanDetayi(slug: string) {
  const ilan = await prisma.ilan.findUnique({
    where: { slug },
    select: {
      ...ILAN_SECIMI,
      aciklamaMd: true,
      afisUrl: true,
      detayUrl: true,
      sezon: true,
      yayinDurumu: true,
      kurum: {
        select: { id: true, ad: true, slug: true, logoUrl: true, webSitesi: true },
      },
      dagiticiKurum: { select: { ad: true, slug: true, logoUrl: true } },
      oturumlar: {
        select: { id: true, ad: true, saat: true, sureDk: true, soruSayisi: true },
        orderBy: { sira: "asc" },
      },
    },
  });

  if (!ilan || ilan.yayinDurumu !== "YAYINDA") return null;
  return ilan;
}

// §4.7 "Bu seriden diğer ilanlar" — aynı kurum + aynı format.
export async function seriDigerIlanlari(ilanId: string, kurumId: string, formatId: string) {
  const satirlar = await prisma.ilan.findMany({
    where: { ...YAYINDA, kurumId, formatId, id: { not: ilanId } },
    select: ILAN_SECIMI,
    orderBy: { sinavTarihi: "asc" },
    take: 6,
  });
  return satirlar.map(ozete);
}

// §4.7 "Aynı hafta yapılan diğer sınavlar" — öğrenci çakışma olup olmadığını
// görmek ister.
export async function ayniHaftadakiIlanlar(ilanId: string, sinavTarihi: Date) {
  const basi = new Date(sinavTarihi);
  basi.setUTCDate(basi.getUTCDate() - 3);
  const sonu = new Date(sinavTarihi);
  sonu.setUTCDate(sonu.getUTCDate() + 3);

  const satirlar = await prisma.ilan.findMany({
    where: { ...YAYINDA, id: { not: ilanId }, sinavTarihi: { gte: basi, lte: sonu } },
    select: ILAN_SECIMI,
    orderBy: { sinavTarihi: "asc" },
    take: 8,
  });
  return satirlar.map(ozete);
}

export async function kurumunIlanlari(kurumSlug: string): Promise<IlanOzet[]> {
  const satirlar = await prisma.ilan.findMany({
    where: { ...YAYINDA, kurum: { slug: kurumSlug } },
    select: ILAN_SECIMI,
    orderBy: { sinavTarihi: "asc" },
  });
  return satirlar.map(ozete);
}

// Filtre çubuğunun seçeneklerini besler (§4.3).
export async function filtreSecenekleri() {
  const [kurumlar, etiketler] = await Promise.all([
    prisma.kurum.findMany({
      where: { aktifMi: true, ilanlar: { some: YAYINDA } },
      select: { id: true, ad: true, slug: true, logoUrl: true },
      orderBy: { ad: "asc" },
    }),
    prisma.etiket.findMany({
      where: { aktifMi: true },
      select: { id: true, ad: true, slug: true, tip: true },
      orderBy: { sira: "asc" },
    }),
  ]);

  return {
    kurumlar,
    gruplar: etiketler.filter((e) => e.tip === "GRUP"),
    duzeyler: etiketler.filter((e) => e.tip === "DUZEY"),
    formatlar: etiketler.filter((e) => e.tip === "FORMAT"),
  };
}

export async function koleksiyonlar() {
  return prisma.koleksiyon.findMany({
    where: { aktifMi: true, menudeMi: true },
    select: { id: true, ad: true, slug: true, ikon: true, varsayilanGorunum: true },
    orderBy: { sira: "asc" },
  });
}

export async function koleksiyonBul(slug: string) {
  const kayit = await prisma.koleksiyon.findUnique({ where: { slug } });
  if (!kayit || !kayit.aktifMi) return null;
  return { ...kayit, filtre: filtreOku(kayit.filtre) };
}

// §4.4: aylık ızgarada tatil bantları.
export async function ayinTakvimNotlari(yil: number, ay: number) {
  const ayinBasi = new Date(Date.UTC(yil, ay - 1, 1));
  const ayinSonu = new Date(Date.UTC(yil, ay, 0));

  return prisma.takvimNotu.findMany({
    where: { aktifMi: true, baslangic: { lte: ayinSonu }, bitis: { gte: ayinBasi } },
    select: { id: true, ad: true, baslangic: true, bitis: true, tip: true },
    orderBy: { baslangic: "asc" },
  });
}
