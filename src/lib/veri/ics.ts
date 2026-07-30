import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { icsUret, ilanUid, type IcsOlayi } from "@/lib/ics";
import { prisma } from "@/lib/prisma";
import { filtreyiWhereCevir } from "@/lib/veri/ilan";
import { filtreOku } from "@/lib/validations/koleksiyon";
import { siteAdresi } from "@/lib/eposta";
import { formatTarih } from "@/lib/tarih";

// Akışlar yalnızca yayındaki ilanları içerir; taslak/arşiv sızmaz.
const YAYINDA = { yayinDurumu: "YAYINDA" } as const;

const ICS_SECIMI = {
  id: true,
  baslik: true,
  slug: true,
  sinavTarihi: true,
  sinavBitisTarihi: true,
  saat: true,
  guncellenme: true,
  kurum: { select: { ad: true } },
  grup: { select: { ad: true } },
  format: { select: { ad: true } },
} satisfies Prisma.IlanSelect;

type IcsSatiri = Prisma.IlanGetPayload<{ select: typeof ICS_SECIMI }>;

export function ilanIcsOlayi(ilan: IcsSatiri): IcsOlayi {
  const adres = `${siteAdresi()}/ilan/${ilan.slug}`;

  const aciklamaSatirlari = [
    `${ilan.kurum.ad} · ${ilan.grup.ad} · ${ilan.format.ad}`,
    ilan.saat ? `Saat: ${ilan.saat}` : null,
    `Tarih: ${formatTarih(ilan.sinavTarihi)}`,
    "",
    adres,
    "",
    // §7 KVKK altbilgisiyle aynı uyarı — takvim kaydı siteden koparak dolaşıyor.
    "Bu kayıt resmî bir kurum duyurusu değildir; bağlayıcı kaynak yayınevinin kendi duyurusudur.",
  ].filter((satir) => satir !== null);

  return {
    uid: ilanUid(ilan.id),
    baslik: ilan.baslik,
    baslangic: ilan.sinavTarihi,
    bitis: ilan.sinavBitisTarihi,
    aciklama: aciklamaSatirlari.join("\n"),
    url: adres,
    // Kalıcı sürüm sayacı yok; güncelleme damgasının saniyesi yeterince
    // artan bir değer üretiyor ve takvim istemcisi LAST-MODIFIED'a da bakıyor.
    sira: Math.floor(ilan.guncellenme.getTime() / 1000) % 2147483647,
    guncellenme: ilan.guncellenme,
  };
}

async function olaylar(where: Prisma.IlanWhereInput): Promise<IcsOlayi[]> {
  const satirlar = await prisma.ilan.findMany({
    where: { ...YAYINDA, ...where },
    select: ICS_SECIMI,
    orderBy: { sinavTarihi: "asc" },
    // Abone olunabilir akış sınırsız büyümemeli; geçmiş zaten filtreleniyor.
    take: 500,
  });
  return satirlar.map(ilanIcsOlayi);
}

/** Geçmiş sınavlar akışta yer tutmasın — 30 günlük geriye tolerans. */
function gecmisiKirp(): Prisma.IlanWhereInput {
  const esik = new Date();
  esik.setUTCHours(0, 0, 0, 0);
  esik.setUTCDate(esik.getUTCDate() - 30);
  return { sinavTarihi: { gte: esik } };
}

export async function tekIlanIcs(slug: string): Promise<string | null> {
  const ilan = await prisma.ilan.findFirst({
    where: { slug, ...YAYINDA },
    select: ICS_SECIMI,
  });
  if (!ilan) return null;

  return icsUret([ilanIcsOlayi(ilan)], { takvimAdi: ilan.baslik });
}

export async function kurumIcs(slug: string): Promise<string | null> {
  const kurum = await prisma.kurum.findFirst({
    where: { slug, aktifMi: true },
    select: { id: true, ad: true },
  });
  if (!kurum) return null;

  return icsUret(await olaylar({ kurumId: kurum.id, ...gecmisiKirp() }), {
    takvimAdi: `${kurum.ad} — Sınav Takvimi`,
    aciklama: `${kurum.ad} yayınevinin deneme sınavı takvimi.`,
  });
}

export async function koleksiyonIcs(slug: string): Promise<string | null> {
  // filtreyiWhereCevir ile aynı çeviriyi kullanmak zorunlu: akış, sitede
  // görünen koleksiyondan farklı bir küme döndürürse kullanıcı bunu asla
  // fark etmez (takvimi sessizce yanlış olur).
  const koleksiyon = await prisma.koleksiyon.findFirst({
    where: { slug, aktifMi: true },
    select: { ad: true, filtre: true },
  });
  if (!koleksiyon) return null;

  const where = filtreyiWhereCevir(filtreOku(koleksiyon.filtre));

  return icsUret(await olaylar({ ...where, ...gecmisiKirp() }), {
    takvimAdi: `${koleksiyon.ad} — Sınav Takvimi`,
    aciklama: `${koleksiyon.ad} koleksiyonundaki deneme sınavları.`,
  });
}
