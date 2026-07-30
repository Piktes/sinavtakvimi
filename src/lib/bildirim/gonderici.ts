import "server-only";
import { epostaGonder } from "@/lib/eposta";
import { prisma } from "@/lib/prisma";
import { hatirlatmaEpostasi } from "@/lib/bildirim/sablon";

// §4.8: "Idempotency zorunlu ... Sistemin en kırılgan yeri."
//
// Kırılganlığın kaynağı planlama değil GÖNDERME: aynı satırı iki işçi aynı
// anda alırsa kullanıcı iki e-posta alır ve bu geri alınamaz. Bu yüzden satır
// tek bir atomik UPDATE ile "sahiplenilir":
//
//   UPDATE ... SET durum='GONDERILIYOR' WHERE durum='BEKLIYOR' ... RETURNING
//
// `FOR UPDATE SKIP LOCKED` ile ikinci işçi aynı satırı beklemek yerine atlar.
// Sahiplenme başarısızsa e-posta hiç denenmez.

export type GonderimDurumu = "BEKLIYOR" | "GONDERILIYOR" | "GONDERILDI" | "HATA" | "IPTAL";

export interface GonderimSonucu {
  sahiplenilen: number;
  gonderilen: number;
  basarisiz: number;
  yapilandirilmamis: number;
}

const VARSAYILAN_PARTI = 100;

/**
 * Bekleyen satırları atomik olarak sahiplenir ve id'lerini döner.
 *
 * Dışa açık çünkü çift sahiplenmenin OLMADIĞI doğrudan sınanmalı
 * (idempotency.dbtest.ts) — üst seviye `bekleyenleriGonder` sonucundan
 * hangi satırın kaç kez alındığı okunamıyor.
 */
export async function sahiplen(simdi: Date, limit: number): Promise<string[]> {
  const satirlar = await prisma.$queryRaw<{ id: string }[]>`
    UPDATE gonderimler
    SET durum = 'GONDERILIYOR'
    WHERE id IN (
      SELECT id FROM gonderimler
      WHERE durum = 'BEKLIYOR' AND planlanan <= ${simdi}
      ORDER BY planlanan
      LIMIT ${limit}
      FOR UPDATE SKIP LOCKED
    )
    RETURNING id
  `;
  return satirlar.map((satir) => satir.id);
}

function kaynakAdi(gonderim: {
  abonelik: {
    ilanId: string | null;
    kurum: { ad: string } | null;
    koleksiyon: { ad: string } | null;
  };
}): string {
  if (gonderim.abonelik.kurum) return gonderim.abonelik.kurum.ad;
  if (gonderim.abonelik.koleksiyon) return gonderim.abonelik.koleksiyon.ad;
  return "tek ilan";
}

export async function bekleyenleriGonder(
  simdi = new Date(),
  limit = VARSAYILAN_PARTI,
): Promise<GonderimSonucu> {
  const idler = await sahiplen(simdi, limit);
  const sonuc: GonderimSonucu = {
    sahiplenilen: idler.length,
    gonderilen: 0,
    basarisiz: 0,
    yapilandirilmamis: 0,
  };
  if (idler.length === 0) return sonuc;

  const gonderimler = await prisma.gonderim.findMany({
    where: { id: { in: idler } },
    select: {
      id: true,
      ofset: true,
      abonelik: {
        select: {
          id: true,
          ilanId: true,
          kurum: { select: { ad: true } },
          koleksiyon: { select: { ad: true } },
          kullanici: { select: { eposta: true, takmaAd: true } },
        },
      },
      ilanId: true,
    },
  });

  const ilanlar = await prisma.ilan.findMany({
    where: { id: { in: gonderimler.map((g) => g.ilanId) } },
    select: {
      id: true,
      baslik: true,
      slug: true,
      sinavTarihi: true,
      saat: true,
      yayinDurumu: true,
      kurum: { select: { ad: true } },
      format: { select: { ad: true } },
    },
  });
  const ilanHaritasi = new Map(ilanlar.map((ilan) => [ilan.id, ilan]));

  for (const gonderim of gonderimler) {
    const ilan = ilanHaritasi.get(gonderim.ilanId);

    // İlan planlamadan sonra yayından kaldırılmışsa hatırlatma anlamsız.
    // Hata değil, iptal — tekrar denenmemeli.
    if (!ilan || ilan.yayinDurumu !== "YAYINDA") {
      await prisma.gonderim.update({
        where: { id: gonderim.id },
        data: { durum: "IPTAL", hata: "İlan yayında değil." },
      });
      continue;
    }

    const { konu, metin } = hatirlatmaEpostasi({
      abonelikId: gonderim.abonelik.id,
      takmaAd: gonderim.abonelik.kullanici.takmaAd,
      ofset: gonderim.ofset,
      ilan: {
        baslik: ilan.baslik,
        slug: ilan.slug,
        sinavTarihi: ilan.sinavTarihi,
        saat: ilan.saat,
        kurumAdi: ilan.kurum.ad,
        formatAdi: ilan.format.ad,
      },
      kaynak: kaynakAdi(gonderim),
    });

    const cikti = await epostaGonder({
      kime: gonderim.abonelik.kullanici.eposta,
      konu,
      metin,
    });

    if (cikti.durum === "gonderildi") {
      sonuc.gonderilen += 1;
      await prisma.gonderim.update({
        where: { id: gonderim.id },
        data: { durum: "GONDERILDI", gonderilen: new Date(), hata: null },
      });
    } else if (cikti.durum === "yapilandirilmamis") {
      // SMTP kurulmamış (geliştirme). Satırı BEKLIYOR'a geri koymak sonsuz
      // döngü yaratır; GONDERILDI demek de yalan olur. Ayrı durum:
      // yapılandırma tamamlandığında elle yeniden planlanabilir.
      sonuc.yapilandirilmamis += 1;
      await prisma.gonderim.update({
        where: { id: gonderim.id },
        data: { durum: "IPTAL", hata: "SMTP yapılandırılmamış." },
      });
    } else {
      // Geçici SMTP hatası: BEKLIYOR'a geri dön, bir sonraki turda denenir.
      sonuc.basarisiz += 1;
      await prisma.gonderim.update({
        where: { id: gonderim.id },
        data: { durum: "BEKLIYOR", hata: cikti.mesaj },
      });
    }
  }

  return sonuc;
}

/**
 * Sahiplenilip yarıda kalmış satırları (işçi çöktü) geri açar.
 * Planlayıcıdan önce çalıştırılır.
 */
export async function askidaKalanlariKurtar(eskilikDk = 30): Promise<number> {
  const esik = new Date(Date.now() - eskilikDk * 60_000);
  const sonuc = await prisma.gonderim.updateMany({
    where: { durum: "GONDERILIYOR", planlanan: { lte: esik } },
    data: { durum: "BEKLIYOR" },
  });
  return sonuc.count;
}
