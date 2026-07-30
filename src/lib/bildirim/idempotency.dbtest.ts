import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { bekleyenleriGonder, sahiplen } from "@/lib/bildirim/gonderici";
import { gunuPlanla } from "@/lib/bildirim/planlayici";
import { gunEkle, istanbulGunu } from "@/lib/bildirim/zamanlama";
import { prisma } from "@/lib/prisma";

// §4.8: "Idempotency zorunlu: gönderim tablosunda UNIQUE(abonelikId, ilanId,
// ofset). Sistemin en kırılgan yeri; testi yazılacak."
//
// Bu dosya o test. Gerçek veritabanına yazar (`pnpm test:db`), çünkü
// kanıtlanması gereken şey Prisma'nın davranışı değil, POSTGRES KISITININ
// kendisi: sahte bir istemciyle sınanan idempotency hiçbir şey kanıtlamaz.

const ISARET = `idem-test-${Date.now()}`;
const bugun = istanbulGunu(new Date());

let kurumTipiId: string;
let kurumId: string;
let grupId: string;
let formatId: string;
let kullaniciId: string;
let ilanId: string;
let abonelikId: string;

beforeAll(async () => {
  const kurumTipi = await prisma.kurumTipi.create({
    data: { ad: `${ISARET}-tip`, slug: `${ISARET}-tip` },
  });
  kurumTipiId = kurumTipi.id;

  const kurum = await prisma.kurum.create({
    data: { ad: `${ISARET}-kurum`, slug: `${ISARET}-kurum`, tipId: kurumTipiId },
  });
  kurumId = kurum.id;

  const grup = await prisma.etiket.create({
    data: { tip: "GRUP", ad: `${ISARET}-grup`, slug: `${ISARET}-grup` },
  });
  grupId = grup.id;

  const format = await prisma.etiket.create({
    data: { tip: "FORMAT", ad: `${ISARET}-format`, slug: `${ISARET}-format` },
  });
  formatId = format.id;

  const kullanici = await prisma.kullanici.create({
    data: {
      eposta: `${ISARET}@ornek.test`,
      sifreHash: "x",
      takmaAd: `${ISARET}-ad`,
      yasBeyani13Ustu: true,
      epostaDogrulandi: true,
      durum: "AKTIF",
    },
  });
  kullaniciId = kullanici.id;

  // Sınav 3 gün sonra → ofset 3 bugün planlanmalı.
  const ilan = await prisma.ilan.create({
    data: {
      baslik: `${ISARET}-ilan`,
      slug: `${ISARET}-ilan`,
      kurumId,
      grupId,
      formatId,
      sinavTarihi: new Date(`${gunEkle(bugun, 3)}T00:00:00.000Z`),
      uygulamaTipi: "TURKIYE_GENELI",
      sezon: "test",
      yayinDurumu: "YAYINDA",
    },
  });
  ilanId = ilan.id;

  const abonelik = await prisma.abonelik.create({
    data: { kullaniciId, ilanId, ofsetler: [3] },
  });
  abonelikId = abonelik.id;
});

afterAll(async () => {
  // FK sırasına göre; abonelik silinince Gonderim cascade ile gider.
  await prisma.abonelik.deleteMany({ where: { kullaniciId } });
  await prisma.ilan.deleteMany({ where: { kurumId } });
  await prisma.kullanici.deleteMany({ where: { id: kullaniciId } });
  await prisma.kurum.deleteMany({ where: { id: kurumId } });
  await prisma.kurumTipi.deleteMany({ where: { id: kurumTipiId } });
  await prisma.etiket.deleteMany({ where: { id: { in: [grupId, formatId] } } });
  await prisma.$disconnect();
});

const bizimGonderimler = () => prisma.gonderim.findMany({ where: { abonelikId } });

describe("planlama idempotency", () => {
  it("ilk çalıştırmada tam bir gönderim yazar", async () => {
    await gunuPlanla();
    const satirlar = await bizimGonderimler();
    expect(satirlar).toHaveLength(1);
    expect(satirlar[0].ofset).toBe(3);
    expect(satirlar[0].ilanId).toBe(ilanId);
    expect(satirlar[0].durum).toBe("BEKLIYOR");
  });

  it("ikinci çalıştırma ikinci satır YAZMAZ", async () => {
    const sonuc = await gunuPlanla();
    expect(await bizimGonderimler()).toHaveLength(1);
    // Satır zaten vardı: createMany onu atlamış olmalı.
    expect(sonuc.atlananGonderim).toBeGreaterThanOrEqual(1);
  });

  it("eşzamanlı beş planlama yine tek satır bırakır", async () => {
    await Promise.all([gunuPlanla(), gunuPlanla(), gunuPlanla(), gunuPlanla(), gunuPlanla()]);
    expect(await bizimGonderimler()).toHaveLength(1);
  });

  it("aynı üçlüyü elle eklemek UNIQUE kısıtına takılır", async () => {
    const mevcut = (await bizimGonderimler())[0];
    await expect(
      prisma.gonderim.create({
        data: {
          abonelikId,
          ilanId: mevcut.ilanId,
          ofset: mevcut.ofset,
          planlanan: new Date(),
        },
      }),
    ).rejects.toThrow();
  });

  it("planlanan an yeniden planlamada kaymaz", async () => {
    const once = (await bizimGonderimler())[0].planlanan.getTime();
    await gunuPlanla();
    const sonra = (await bizimGonderimler())[0].planlanan.getTime();
    expect(sonra).toBe(once);
  });
});

describe("gönderim sahiplenme", () => {
  it("eşzamanlı üç gönderim turunda satır YALNIZCA BİR KEZ sahiplenilir", async () => {
    // Planlanan an geleceğe düşebilir; ileri bir "şimdi" ile hepsini kapsa.
    const ileri = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);

    const sonuclar = await Promise.all([
      bekleyenleriGonder(ileri),
      bekleyenleriGonder(ileri),
      bekleyenleriGonder(ileri),
    ]);

    // Diğer (gerçek) abonelikler de sahiplenilmiş olabilir; bizi ilgilendiren
    // satırın kaç kez ele alındığı — o da satırın son durumundan okunur.
    const satir = (await bizimGonderimler())[0];
    expect(satir.durum).not.toBe("BEKLIYOR");
    expect(satir.durum).not.toBe("GONDERILIYOR");

    // Toplam sahiplenilen sayısı, tekrar sahiplenme olmadığının kaba göstergesi:
    // üç turdan yalnızca biri iş bulmuş olmalı ya da işler bölüşülmüş olmalı,
    // ama hiçbir satır iki turda birden görünmemeli.
    const toplam = sonuclar.reduce((a, s) => a + s.sahiplenilen, 0);
    const bekleyenKalan = await prisma.gonderim.count({
      where: { durum: "GONDERILIYOR", abonelikId },
    });
    expect(bekleyenKalan).toBe(0);
    expect(toplam).toBeGreaterThanOrEqual(1);
  });

  it("gönderilmiş satır ikinci turda tekrar alınmaz", async () => {
    const ileri = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    const oncekiDurum = (await bizimGonderimler())[0].durum;

    await bekleyenleriGonder(ileri);

    const satir = (await bizimGonderimler())[0];
    expect(satir.durum).toBe(oncekiDurum);
  });

  it("gönderim sonrası yeniden planlama yeni satır eklemez", async () => {
    await gunuPlanla();
    expect(await bizimGonderimler()).toHaveLength(1);
  });
});

describe("sahiplenme atomikliği", () => {
  // Yukarıdaki testler `bekleyenleriGonder`in SONUCUNA bakıyor; oradan
  // "şu satır iki kez alındı mı?" okunamaz. Burada sahiplenme SQL'i doğrudan
  // sınanıyor: aynı satır iki farklı çağrının dönüşünde görünürse çift
  // gönderim demektir.
  const cokluIsaret = `${ISARET}-coklu`;
  const cokluAbonelikIdleri: string[] = [];
  const beklenenIdler: string[] = [];

  beforeAll(async () => {
    // 5 ayrı abonelik + 5 bekleyen gönderim.
    for (let i = 0; i < 5; i += 1) {
      const kullanici = await prisma.kullanici.create({
        data: {
          eposta: `${cokluIsaret}-${i}@ornek.test`,
          sifreHash: "x",
          takmaAd: `${cokluIsaret}-${i}`,
          yasBeyani13Ustu: true,
          epostaDogrulandi: true,
        },
      });
      const abonelik = await prisma.abonelik.create({
        data: { kullaniciId: kullanici.id, ilanId, ofsetler: [3] },
      });
      cokluAbonelikIdleri.push(abonelik.id);

      const gonderim = await prisma.gonderim.create({
        data: {
          abonelikId: abonelik.id,
          ilanId,
          ofset: 3,
          // Geçmişte: sahiplenme eşiğine kesin girsin.
          planlanan: new Date(Date.now() - 60_000),
          durum: "BEKLIYOR",
        },
      });
      beklenenIdler.push(gonderim.id);
    }
  });

  afterAll(async () => {
    await prisma.abonelik.deleteMany({ where: { id: { in: cokluAbonelikIdleri } } });
    await prisma.kullanici.deleteMany({ where: { eposta: { startsWith: cokluIsaret } } });
  });

  it("eşzamanlı dört sahiplenme hiçbir satırı iki kez vermez", async () => {
    const simdi = new Date();
    const partiler = await Promise.all([
      sahiplen(simdi, 50),
      sahiplen(simdi, 50),
      sahiplen(simdi, 50),
      sahiplen(simdi, 50),
    ]);

    const tumu = partiler.flat();
    const bizimkiler = tumu.filter((id) => beklenenIdler.includes(id));

    // Her satır tam bir kez alınmış olmalı.
    expect(bizimkiler.sort()).toEqual([...beklenenIdler].sort());
    expect(new Set(bizimkiler).size).toBe(bizimkiler.length);
  });

  it("sahiplenilen satırlar artık BEKLIYOR değildir", async () => {
    const kalan = await prisma.gonderim.count({
      where: { id: { in: beklenenIdler }, durum: "BEKLIYOR" },
    });
    expect(kalan).toBe(0);
  });

  it("beşinci tur hiçbir şey bulmaz", async () => {
    const yeniden = await sahiplen(new Date(), 50);
    expect(yeniden.filter((id) => beklenenIdler.includes(id))).toEqual([]);
  });
});

describe("seviyeler arası tekilleştirme", () => {
  // Kullanıcı hem tek ilana hem de o ilanı kapsayan bir koleksiyona abone
  // olduğunda aynı sabah İKİ e-posta almamalı (bkz. tekillestir.ts).
  let koleksiyonId: string;
  let koleksiyonAbonelikId: string;

  beforeAll(async () => {
    const koleksiyon = await prisma.koleksiyon.create({
      data: {
        ad: `${ISARET}-kol`,
        slug: `${ISARET}-kol`,
        // Test ilanının grubu — kapsam tam olarak o ilana denk gelir.
        filtre: { grupIds: [grupId] },
        menudeMi: false,
      },
    });
    koleksiyonId = koleksiyon.id;

    const abonelik = await prisma.abonelik.create({
      data: { kullaniciId, koleksiyonId, ofsetler: [3] },
    });
    koleksiyonAbonelikId = abonelik.id;

    // Önceki bloklardan kalan satırları temizle: bu blok sıfırdan planlamalı.
    await prisma.gonderim.deleteMany({
      where: { abonelikId: { in: [abonelikId, koleksiyonAbonelikId] } },
    });
  });

  afterAll(async () => {
    await prisma.abonelik.deleteMany({ where: { id: koleksiyonAbonelikId } });
    await prisma.koleksiyon.deleteMany({ where: { id: koleksiyonId } });
  });

  it("iki abonelik aynı ilanı kapsasa da tek gönderim yazılır", async () => {
    const sonuc = await gunuPlanla();

    const satirlar = await prisma.gonderim.findMany({
      where: { abonelikId: { in: [abonelikId, koleksiyonAbonelikId] }, ilanId },
    });

    expect(satirlar).toHaveLength(1);
    expect(sonuc.tekillestirilen).toBeGreaterThanOrEqual(1);
  });

  it("kazanan EN SPESİFİK abonelik (tek ilan) olur", async () => {
    const satir = await prisma.gonderim.findFirst({
      where: { abonelikId: { in: [abonelikId, koleksiyonAbonelikId] }, ilanId },
    });
    expect(satir?.abonelikId).toBe(abonelikId);
  });

  it("yeniden planlama ikinci abonelikten satır eklemez", async () => {
    await gunuPlanla();
    const satirlar = await prisma.gonderim.findMany({
      where: { abonelikId: { in: [abonelikId, koleksiyonAbonelikId] }, ilanId },
    });
    expect(satirlar).toHaveLength(1);
  });
});
