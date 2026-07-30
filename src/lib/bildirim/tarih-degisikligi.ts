import "server-only";
import { epostaGonder } from "@/lib/eposta";
import { prisma } from "@/lib/prisma";
import { tarihDegistiEpostasi } from "@/lib/bildirim/sablon";

// §4.8: "Tarih değişirse planlı gönderimler iptal edilip yeniden hesaplanır
// **ve** abonelere ayrı 'tarih değişti' bildirimi gider (tercihten bağımsız,
// kritik bilgi)."
//
// İki ayrı iş, farklı zamanlamalarla:
//
//   1. İPTAL — SENKRON, admin kaydederken. Eski tarihe göre hesaplanmış
//      hatırlatmalar artık yanlış; tek bir UPDATE, hızlı. Bir sonraki
//      planlama turu (06:00) yeni tarihe göre yenilerini yazar.
//
//   2. BİLGİLENDİRME — KUYRUKTA, işçi sürecinde. Ofset tercihinden bağımsız
//      gönderilir (kritik bilgi). Admin'in kaydet isteğinde yapılmıyor:
//      yüzlerce aboneye SMTP üzerinden yazmak formu dakikalarca bekletir ve
//      SMTP düşerse admin kaydı başarısız sanır.

export interface TarihDegisikligiSonucu {
  iptalEdilen: number;
  bilgilendirilen: number;
  basarisiz: number;
  /** SMTP yapılandırılmamış (geliştirme) — hata değil, ayrı sayılıyor. */
  yapilandirilmamis: number;
}

/**
 * İlanı hedefleyen TÜM abonelikleri bulur — üç seviye de dahil.
 *
 * Koleksiyon aboneliklerinde kapsam filtreden hesaplanıyor; burada tersini
 * yapmak (ilandan koleksiyona gitmek) gerekiyor, o yüzden aday koleksiyonlar
 * `filtreyiWhereCevir` ile tek tek sınanıyor.
 */
async function ilgiliAbonelikler(ilanId: string) {
  const { filtreyiWhereCevir } = await import("@/lib/veri/ilan");
  const { filtreOku } = await import("@/lib/validations/koleksiyon");

  const ilan = await prisma.ilan.findUnique({
    where: { id: ilanId },
    select: { id: true, kurumId: true },
  });
  if (!ilan) return [];

  const koleksiyonlar = await prisma.koleksiyon.findMany({
    where: { aktifMi: true },
    select: { id: true, filtre: true },
  });

  const kapsayanKoleksiyonIdleri: string[] = [];
  for (const koleksiyon of koleksiyonlar) {
    const sayi = await prisma.ilan.count({
      where: { id: ilanId, ...filtreyiWhereCevir(filtreOku(koleksiyon.filtre)) },
    });
    if (sayi > 0) kapsayanKoleksiyonIdleri.push(koleksiyon.id);
  }

  return prisma.abonelik.findMany({
    where: {
      aktifMi: true,
      kullanici: { epostaDogrulandi: true, durum: "AKTIF" },
      OR: [
        { ilanId },
        { kurumId: ilan.kurumId },
        ...(kapsayanKoleksiyonIdleri.length
          ? [{ koleksiyonId: { in: kapsayanKoleksiyonIdleri } }]
          : []),
      ],
    },
    select: {
      id: true,
      kullaniciId: true,
      ilanId: true,
      kurum: { select: { ad: true } },
      koleksiyon: { select: { ad: true } },
      kullanici: { select: { eposta: true, takmaAd: true } },
    },
  });
}

/**
 * Eski tarihe göre planlanmış, henüz gönderilmemiş hatırlatmaları iptal eder.
 *
 * GONDERILDI olanlara DOKUNULMAZ: kullanıcı onu zaten almış; silmek geçmişi
 * yeniden yazmak ve idempotency kaydını bozmak olurdu.
 */
export async function planliGonderimleriIptalEt(ilanId: string): Promise<number> {
  const sonuc = await prisma.gonderim.updateMany({
    where: { ilanId, durum: { in: ["BEKLIYOR", "GONDERILIYOR"] } },
    data: { durum: "IPTAL", hata: "Sınav tarihi değişti; yeniden planlanacak." },
  });
  return sonuc.count;
}

export async function tarihDegistiBildir(
  ilanId: string,
  eskiTarih: Date,
  yeniTarih: Date,
): Promise<TarihDegisikligiSonucu> {
  const sonuc: TarihDegisikligiSonucu = {
    iptalEdilen: 0,
    bilgilendirilen: 0,
    basarisiz: 0,
    yapilandirilmamis: 0,
  };

  // İptal senkron yapılmış olabilir; kuyruktan çağrılırken ikinci kez
  // çağırmak zararsız (idempotent updateMany).
  sonuc.iptalEdilen = await planliGonderimleriIptalEt(ilanId);

  const abonelikler = await ilgiliAbonelikler(ilanId);
  if (abonelikler.length === 0) return sonuc;

  const ilan = await prisma.ilan.findUnique({
    where: { id: ilanId },
    select: { baslik: true, slug: true, kurum: { select: { ad: true } } },
  });
  if (!ilan) return sonuc;

  // Aynı kullanıcı birden çok seviyeden abone olabilir; tek bildirim yeter.
  const gorulenKullanicilar = new Set<string>();

  for (const abonelik of abonelikler) {
    if (gorulenKullanicilar.has(abonelik.kullaniciId)) continue;
    gorulenKullanicilar.add(abonelik.kullaniciId);

    const { konu, metin } = tarihDegistiEpostasi({
      abonelikId: abonelik.id,
      takmaAd: abonelik.kullanici.takmaAd,
      ilan: { baslik: ilan.baslik, slug: ilan.slug, kurumAdi: ilan.kurum.ad },
      eskiTarih,
      yeniTarih,
      kaynak: abonelik.kurum?.ad ?? abonelik.koleksiyon?.ad ?? "tek ilan",
    });

    const cikti = await epostaGonder({
      kime: abonelik.kullanici.eposta,
      konu,
      metin,
    });

    if (cikti.durum === "gonderildi") sonuc.bilgilendirilen += 1;
    else if (cikti.durum === "yapilandirilmamis") sonuc.yapilandirilmamis += 1;
    else sonuc.basarisiz += 1;
  }

  return sonuc;
}
