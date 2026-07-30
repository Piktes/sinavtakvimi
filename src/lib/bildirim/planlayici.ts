import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { filtreOku } from "@/lib/validations/koleksiyon";
import { filtreyiWhereCevir } from "@/lib/veri/ilan";
import { gonderimAnahtari, gonderimAni, hedefGunler, istanbulGunu } from "@/lib/bildirim/zamanlama";
import {
  kullaniciAnahtari,
  tekillestir,
  type AbonelikSeviyesi,
  type GonderimAdayi,
} from "@/lib/bildirim/tekillestir";

// §4.8: "pg-boss günlük planlayıcı (06:00)". Planlayıcı e-POSTA GÖNDERMEZ —
// yalnızca `Gonderim` satırları yazar. Gönderme ayrı bir iş (gonderici.ts).
//
// Ayrım kasıtlı: gönderim SMTP yüzünden başarısız olursa satır BEKLIYOR
// kalır ve tekrar denenir; planlama yeniden çalışsa bile UNIQUE kısıtı
// ikinci satırı engeller.

export interface PlanlamaSonucu {
  gun: string;
  incelenenAbonelik: number;
  olusturulanGonderim: number;
  /** UNIQUE(abonelikId, ilanId, ofset) yüzünden createMany'nin atladıkları. */
  atlananGonderim: number;
  /** Aynı turda başka bir SEVİYEDEN de gelen, en spesifiğe indirgenenler. */
  tekillestirilen: number;
  /** Aynı (kullanıcı, ilan, ofset) için DB'de zaten satır olanlar. */
  zatenPlanlanmis: number;
}

type AbonelikSatiri = Prisma.AbonelikGetPayload<{
  select: {
    id: true;
    kullaniciId: true;
    ofsetler: true;
    ilanId: true;
    kurumId: true;
    koleksiyonId: true;
    koleksiyon: { select: { filtre: true } };
  };
}>;

function seviyesi(abonelik: AbonelikSatiri): AbonelikSeviyesi | null {
  if (abonelik.ilanId) return "ilan";
  if (abonelik.kurumId) return "kurum";
  if (abonelik.koleksiyonId) return "koleksiyon";
  return null; // CHECK kısıtı buna izin vermiyor.
}

/** Aboneliğin hedeflediği ilan kümesini Prisma where'ine çevirir. */
function abonelikKapsami(abonelik: AbonelikSatiri): Prisma.IlanWhereInput | null {
  if (abonelik.ilanId) return { id: abonelik.ilanId };
  if (abonelik.kurumId) return { kurumId: abonelik.kurumId };
  if (abonelik.koleksiyonId && abonelik.koleksiyon) {
    // §4.8: "Koleksiyon aboneliği en güçlüsü: kullanıcı bir kez abone olur,
    // admin yeni ilan girdikçe otomatik kapsanır." Bu yüzden kapsam her
    // planlamada filtreden yeniden hesaplanıyor, kayıtlı bir ilan listesinden
    // değil.
    return filtreyiWhereCevir(filtreOku(abonelik.koleksiyon.filtre));
  }
  return null;
}

/**
 * Bu (kullanıcı, ilan, ofset) üçlüleri için ZATEN bir gönderim var mı?
 *
 * `tekillestir` yalnızca bu turun adaylarını karşılaştırır. Kullanıcı dün
 * koleksiyona, bugün ayrıca tek ilana abone olduysa dünkü satır DB'de duruyor
 * olur; onu görmezsek aynı sabah iki e-posta gider.
 */
async function zatenPlanlananlar(adaylar: GonderimAdayi[]): Promise<Set<string>> {
  if (adaylar.length === 0) return new Set();

  const mevcut = await prisma.gonderim.findMany({
    where: {
      ilanId: { in: [...new Set(adaylar.map((a) => a.ilanId))] },
      ofset: { in: [...new Set(adaylar.map((a) => a.ofset))] },
      // İptal edilmiş satır "gönderilmiş" sayılmaz; yeniden planlanabilsin.
      durum: { not: "IPTAL" },
      abonelik: { kullaniciId: { in: [...new Set(adaylar.map((a) => a.kullaniciId))] } },
    },
    select: {
      ilanId: true,
      ofset: true,
      abonelik: { select: { kullaniciId: true } },
    },
  });

  return new Set(
    mevcut.map((satir) => kullaniciAnahtari(satir.abonelik.kullaniciId, satir.ilanId, satir.ofset)),
  );
}

/**
 * Verilen gün için bekleyen gönderimleri oluşturur.
 *
 * Idempotent: aynı gün için ikinci kez çağrılırsa `UNIQUE(abonelikId, ilanId,
 * ofset)` sayesinde yeni satır yazılmaz (`skipDuplicates`). Dönen
 * `atlananGonderim` bunu görünür kılar.
 */
export async function gunuPlanla(simdi = new Date()): Promise<PlanlamaSonucu> {
  const bugun = istanbulGunu(simdi);

  const abonelikler = await prisma.abonelik.findMany({
    where: {
      aktifMi: true,
      // Doğrulanmamış adrese ve askıya alınmış hesaba bildirim gitmez.
      kullanici: { epostaDogrulandi: true, durum: "AKTIF" },
    },
    select: {
      id: true,
      kullaniciId: true,
      ofsetler: true,
      ilanId: true,
      kurumId: true,
      koleksiyonId: true,
      koleksiyon: { select: { filtre: true } },
    },
  });

  const adaylar: GonderimAdayi[] = [];

  for (const abonelik of abonelikler) {
    const kapsam = abonelikKapsami(abonelik);
    const seviye = seviyesi(abonelik);
    if (!kapsam || !seviye || abonelik.ofsetler.length === 0) continue;

    for (const { ofset, gun } of hedefGunler(bugun, abonelik.ofsetler)) {
      const ilanlar = await prisma.ilan.findMany({
        where: {
          ...kapsam,
          yayinDurumu: "YAYINDA",
          sinavTarihi: new Date(`${gun}T00:00:00.000Z`),
        },
        select: { id: true },
      });

      for (const ilan of ilanlar) {
        adaylar.push({
          kullaniciId: abonelik.kullaniciId,
          abonelikId: abonelik.id,
          seviye,
          ilanId: ilan.id,
          ofset,
        });
      }
    }
  }

  // Aynı kullanıcıya aynı sınav için iki farklı abonelikten iki e-posta
  // gitmesin: en spesifik abonelik kazanır (bkz. tekillestir.ts).
  const kazananlar = tekillestir(adaylar);
  const mevcutAnahtarlar = await zatenPlanlananlar(kazananlar);

  const yazilacaklar = kazananlar.filter(
    (aday) => !mevcutAnahtarlar.has(kullaniciAnahtari(aday.kullaniciId, aday.ilanId, aday.ofset)),
  );

  const satirlar: Prisma.GonderimCreateManyInput[] = yazilacaklar.map((aday) => ({
    abonelikId: aday.abonelikId,
    ilanId: aday.ilanId,
    ofset: aday.ofset,
    planlanan: gonderimAni(bugun, gonderimAnahtari(aday.abonelikId, aday.ilanId, aday.ofset)),
    durum: "BEKLIYOR",
  }));

  const sonuc = await prisma.gonderim.createMany({ data: satirlar, skipDuplicates: true });

  return {
    gun: bugun,
    incelenenAbonelik: abonelikler.length,
    olusturulanGonderim: sonuc.count,
    atlananGonderim: satirlar.length - sonuc.count,
    tekillestirilen: adaylar.length - kazananlar.length,
    zatenPlanlanmis: kazananlar.length - yazilacaklar.length,
  };
}
