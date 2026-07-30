"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";
import { denetimYaz } from "@/lib/denetim";
import { prisma } from "@/lib/prisma";
import { requireRol } from "@/lib/rbac";
import { sezonTuret } from "@/lib/sezon";
import { slugla } from "@/lib/slug";
import { ilanSemasi, topluSeriSemasi } from "@/lib/validations/ilan";

const YAZMA_ROLLERI = ["ADMIN", "EDITOR"] as const;

export interface IlanFormDurumu {
  hata?: string;
  alanHatalari?: Record<string, string>;
}

// "YYYY-MM-DD" → @db.Date için UTC gece yarısı.
function gun(deger: string): Date {
  return new Date(`${deger}T00:00:00.000Z`);
}

// "YYYY-MM-DDTHH:mm" (Europe/Istanbul girdisi) → UTC. Türkiye'de DST yok.
function istanbulZamani(deger: string): Date {
  return new Date(`${deger}:00.000+03:00`);
}

// Slug çakışmasını çözer — aynı seri farklı sezonlarda tekrarlanabiliyor.
async function benzersizSlug(temel: string, haricId?: string): Promise<string> {
  let aday = temel;
  let sayac = 2;

  for (;;) {
    const mevcut = await prisma.ilan.findUnique({ where: { slug: aday }, select: { id: true } });
    if (!mevcut || mevcut.id === haricId) return aday;
    aday = `${temel}-${sayac}`;
    sayac += 1;
  }
}

export async function ilanKaydet(
  _oncekiDurum: IlanFormDurumu | undefined,
  formData: FormData,
): Promise<IlanFormDurumu> {
  // §6: middleware yeterli değil — action doğrudan çağrılabilir.
  const oturum = await requireRol(YAZMA_ROLLERI);
  const id = (formData.get("id") as string) || undefined;

  let oturumlarHam: unknown = [];
  const oturumlarJson = formData.get("oturumlarJson");
  if (typeof oturumlarJson === "string" && oturumlarJson) {
    try {
      oturumlarHam = JSON.parse(oturumlarJson);
    } catch {
      return { hata: "Oturum listesi okunamadı." };
    }
  }

  const ayristirilmis = ilanSemasi.safeParse({
    baslik: formData.get("baslik"),
    slug: formData.get("slug"),
    seriNo: formData.get("seriNo"),
    kurumId: formData.get("kurumId"),
    dagiticiKurumId: formData.get("dagiticiKurumId"),
    grupId: formData.get("grupId"),
    formatId: formData.get("formatId"),
    duzeyIds: formData.getAll("duzeyIds"),
    sinavTarihi: formData.get("sinavTarihi"),
    sinavBitisTarihi: formData.get("sinavBitisTarihi"),
    saat: formData.get("saat"),
    sonSiparisTarihi: formData.get("sonSiparisTarihi"),
    cevapAnahtariZamani: formData.get("cevapAnahtariZamani"),
    uygulamaTipi: formData.get("uygulamaTipi"),
    zorluk: formData.get("zorluk"),
    aciklamaMd: formData.get("aciklamaMd"),
    afisUrl: formData.get("afisUrl"),
    detayUrl: formData.get("detayUrl"),
    sezon: formData.get("sezon"),
    oneCikar: formData.get("oneCikar"),
    yayinDurumu: formData.get("yayinDurumu"),
    oturumlar: oturumlarHam,
  });

  if (!ayristirilmis.success) {
    const alanHatalari: Record<string, string> = {};
    let oturumHatasi: string | undefined;
    for (const sorun of ayristirilmis.error.issues) {
      if (sorun.path[0] === "oturumlar") {
        oturumHatasi = `Oturumlar: ${sorun.message}`;
        continue;
      }
      alanHatalari[String(sorun.path[0])] = sorun.message;
    }
    return { alanHatalari, hata: oturumHatasi };
  }

  const veri = ayristirilmis.data;
  const sinavTarihi = gun(veri.sinavTarihi);
  const slug = await benzersizSlug(
    veri.slug ?? slugla(`${veri.baslik}-${veri.sezon ?? sezonTuret(sinavTarihi)}`),
    id,
  );

  const ortak = {
    baslik: veri.baslik,
    slug,
    seriNo: veri.seriNo ?? null,
    kurumId: veri.kurumId,
    dagiticiKurumId: veri.dagiticiKurumId ?? null,
    grupId: veri.grupId,
    formatId: veri.formatId,
    sinavTarihi,
    sinavBitisTarihi: veri.sinavBitisTarihi ? gun(veri.sinavBitisTarihi) : null,
    saat: veri.saat ?? null,
    sonSiparisTarihi: veri.sonSiparisTarihi ? gun(veri.sonSiparisTarihi) : null,
    cevapAnahtariZamani: veri.cevapAnahtariZamani ? istanbulZamani(veri.cevapAnahtariZamani) : null,
    uygulamaTipi: veri.uygulamaTipi,
    zorluk: veri.zorluk ?? null,
    aciklamaMd: veri.aciklamaMd ?? null,
    afisUrl: veri.afisUrl ?? null,
    detayUrl: veri.detayUrl ?? null,
    // §2: boş bırakılırsa sınav tarihinden türetilir — tek yerde.
    sezon: veri.sezon ?? sezonTuret(sinavTarihi),
    oneCikar: veri.oneCikar,
    yayinDurumu: veri.yayinDurumu,
  };

  const oturumVerileri = veri.oturumlar.map((oturum, sira) => ({
    ad: oturum.ad,
    saat: oturum.saat ?? null,
    sureDk: oturum.sureDk ?? null,
    soruSayisi: oturum.soruSayisi ?? null,
    sira,
  }));

  try {
    if (id) {
      const oncesi = await prisma.ilan.findUnique({
        where: { id },
        include: { oturumlar: true, duzeyler: { select: { id: true } } },
      });
      if (!oncesi) return { hata: "İlan bulunamadı." };

      // Oturumlar tek seferde değiştirilir: önce silinir, sonra yazılır.
      const sonrasi = await prisma.$transaction(async (tx) => {
        await tx.oturum.deleteMany({ where: { ilanId: id } });
        return tx.ilan.update({
          where: { id },
          data: {
            ...ortak,
            duzeyler: { set: veri.duzeyIds.map((duzeyId) => ({ id: duzeyId })) },
            oturumlar: { create: oturumVerileri },
          },
          include: { oturumlar: true, duzeyler: { select: { id: true } } },
        });
      });

      await denetimYaz({
        adminId: oturum.kullaniciId,
        eylem: "GUNCELLE",
        varlik: "Ilan",
        varlikId: id,
        oncesi,
        sonrasi,
      });
    } else {
      const olusturulan = await prisma.ilan.create({
        data: {
          ...ortak,
          olusturanId: oturum.kullaniciId,
          duzeyler: { connect: veri.duzeyIds.map((duzeyId) => ({ id: duzeyId })) },
          oturumlar: { create: oturumVerileri },
        },
        include: { oturumlar: true, duzeyler: { select: { id: true } } },
      });

      await denetimYaz({
        adminId: oturum.kullaniciId,
        eylem: "OLUSTUR",
        varlik: "Ilan",
        varlikId: olusturulan.id,
        sonrasi: olusturulan,
      });
    }
  } catch (hata) {
    if (hata instanceof Prisma.PrismaClientKnownRequestError && hata.code === "P2002") {
      return { alanHatalari: { slug: "Bu slug zaten kullanılıyor." } };
    }
    // DB CHECK kısıtı (ilanlar_bitis_sinavdan_sonra) — Zod'u atlayan bir yol
    // eklenirse savunma katmanı burada devreye girer.
    if (hata instanceof Prisma.PrismaClientKnownRequestError && hata.code === "P2004") {
      return { hata: "Tarih kısıtı sağlanmadı: bitiş tarihi sınav tarihinden sonra olmalı." };
    }
    throw hata;
  }

  revalidatePath("/yonetim/ilanlar");
  revalidatePath("/takvim");
  redirect("/yonetim/ilanlar");
}

export async function ilanSil(id: string): Promise<{ hata?: string }> {
  const oturum = await requireRol(YAZMA_ROLLERI);

  const silinen = await prisma.ilan.delete({
    where: { id },
    include: { oturumlar: true },
  });

  await denetimYaz({
    adminId: oturum.kullaniciId,
    eylem: "SIL",
    varlik: "Ilan",
    varlikId: id,
    oncesi: silinen,
  });

  revalidatePath("/yonetim/ilanlar");
  revalidatePath("/takvim");
  return {};
}

// §6: yıl kopyalama — tarihler +1 yıl, TASLAK olarak açılır.
export async function ilanYilKopyala(id: string): Promise<{ hata?: string }> {
  const oturum = await requireRol(YAZMA_ROLLERI);

  const orijinal = await prisma.ilan.findUnique({
    where: { id },
    include: { oturumlar: true, duzeyler: { select: { id: true } } },
  });
  if (!orijinal) return { hata: "İlan bulunamadı." };

  const birYilEkle = <T extends Date | null>(tarih: T): T => {
    if (!tarih) return tarih;
    const yeni = new Date(tarih);
    yeni.setUTCFullYear(yeni.getUTCFullYear() + 1);
    return yeni as T;
  };

  const yeniSinavTarihi = birYilEkle(orijinal.sinavTarihi);
  const yeniSezon = sezonTuret(yeniSinavTarihi);

  const kopya = await prisma.ilan.create({
    data: {
      baslik: orijinal.baslik,
      slug: await benzersizSlug(slugla(`${orijinal.baslik}-${yeniSezon}`)),
      seriNo: orijinal.seriNo,
      kurumId: orijinal.kurumId,
      dagiticiKurumId: orijinal.dagiticiKurumId,
      grupId: orijinal.grupId,
      formatId: orijinal.formatId,
      sinavTarihi: yeniSinavTarihi,
      sinavBitisTarihi: birYilEkle(orijinal.sinavBitisTarihi),
      saat: orijinal.saat,
      sonSiparisTarihi: birYilEkle(orijinal.sonSiparisTarihi),
      cevapAnahtariZamani: birYilEkle(orijinal.cevapAnahtariZamani),
      uygulamaTipi: orijinal.uygulamaTipi,
      zorluk: orijinal.zorluk,
      aciklamaMd: orijinal.aciklamaMd,
      afisUrl: orijinal.afisUrl,
      detayUrl: orijinal.detayUrl,
      sezon: yeniSezon,
      oneCikar: false,
      yayinDurumu: "TASLAK",
      olusturanId: oturum.kullaniciId,
      duzeyler: { connect: orijinal.duzeyler.map((duzey) => ({ id: duzey.id })) },
      oturumlar: {
        create: orijinal.oturumlar.map((o) => ({
          ad: o.ad,
          saat: o.saat,
          sureDk: o.sureDk,
          soruSayisi: o.soruSayisi,
          sira: o.sira,
        })),
      },
    },
  });

  await denetimYaz({
    adminId: oturum.kullaniciId,
    eylem: "OLUSTUR",
    varlik: "Ilan",
    varlikId: kopya.id,
    sonrasi: kopya,
  });

  revalidatePath("/yonetim/ilanlar");
  redirect(`/yonetim/ilanlar/${kopya.id}`);
}

// §4.1 toplu seri oluşturma: ortak alanlar bir kez, tarihler satır satır.
// "1000+ ilan tek tek girilemeyeceği için bu ekran zorunludur."
export async function topluSeriOlustur(
  _oncekiDurum: IlanFormDurumu | undefined,
  formData: FormData,
): Promise<IlanFormDurumu> {
  const oturum = await requireRol(YAZMA_ROLLERI);

  let satirlarHam: unknown = [];
  const satirlarJson = formData.get("satirlarJson");
  if (typeof satirlarJson === "string" && satirlarJson) {
    try {
      satirlarHam = JSON.parse(satirlarJson);
    } catch {
      return { hata: "Tarih satırları okunamadı." };
    }
  }

  const ayristirilmis = topluSeriSemasi.safeParse({
    baslikOnEki: formData.get("baslikOnEki"),
    kurumId: formData.get("kurumId"),
    dagiticiKurumId: formData.get("dagiticiKurumId"),
    grupId: formData.get("grupId"),
    formatId: formData.get("formatId"),
    duzeyIds: formData.getAll("duzeyIds"),
    uygulamaTipi: formData.get("uygulamaTipi"),
    zorluk: formData.get("zorluk"),
    saat: formData.get("saat"),
    baslangicNo: formData.get("baslangicNo"),
    satirlar: satirlarHam,
  });

  if (!ayristirilmis.success) {
    const alanHatalari: Record<string, string> = {};
    let satirHatasi: string | undefined;
    for (const sorun of ayristirilmis.error.issues) {
      if (sorun.path[0] === "satirlar") {
        satirHatasi = `Tarih satırları: ${sorun.message}`;
        continue;
      }
      alanHatalari[String(sorun.path[0])] = sorun.message;
    }
    return { alanHatalari, hata: satirHatasi };
  }

  const veri = ayristirilmis.data;

  // Satır bazlı doğrulama: bitiş > sınav tarihi (DB CHECK ile aynı kural).
  for (const [index, satir] of veri.satirlar.entries()) {
    if (satir.sinavBitisTarihi && satir.sinavBitisTarihi <= satir.sinavTarihi) {
      return { hata: `${index + 1}. satır: bitiş tarihi sınav tarihinden sonra olmalı.` };
    }
  }

  const olusturulanlar: string[] = [];

  for (const [index, satir] of veri.satirlar.entries()) {
    const no = veri.baslangicNo + index;
    const sinavTarihi = gun(satir.sinavTarihi);
    const sezon = sezonTuret(sinavTarihi);
    const baslik = `${veri.baslikOnEki} ${String(no).padStart(2, "0")}`;

    const ilan = await prisma.ilan.create({
      data: {
        baslik,
        slug: await benzersizSlug(slugla(`${baslik}-${sezon}`)),
        seriNo: no,
        kurumId: veri.kurumId,
        dagiticiKurumId: veri.dagiticiKurumId ?? null,
        grupId: veri.grupId,
        formatId: veri.formatId,
        sinavTarihi,
        sinavBitisTarihi: satir.sinavBitisTarihi ? gun(satir.sinavBitisTarihi) : null,
        saat: veri.saat ?? null,
        sonSiparisTarihi: satir.sonSiparisTarihi ? gun(satir.sonSiparisTarihi) : null,
        cevapAnahtariZamani: satir.cevapAnahtariZamani
          ? istanbulZamani(satir.cevapAnahtariZamani)
          : null,
        uygulamaTipi: veri.uygulamaTipi,
        zorluk: veri.zorluk ?? null,
        sezon,
        // §4.2 deseni: toplu üretilen kayıtlar TASLAK gelir, admin gözden
        // geçirip yayınlar.
        yayinDurumu: "TASLAK",
        olusturanId: oturum.kullaniciId,
        duzeyler: { connect: veri.duzeyIds.map((duzeyId) => ({ id: duzeyId })) },
      },
    });

    olusturulanlar.push(ilan.id);
  }

  await denetimYaz({
    adminId: oturum.kullaniciId,
    eylem: "OLUSTUR",
    varlik: "Ilan",
    varlikId: olusturulanlar.join(","),
    sonrasi: { adet: olusturulanlar.length, baslikOnEki: veri.baslikOnEki },
  });

  revalidatePath("/yonetim/ilanlar");
  redirect(`/yonetim/ilanlar?olusturuldu=${olusturulanlar.length}`);
}
