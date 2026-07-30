"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";
import { denetimYaz } from "@/lib/denetim";
import { gorselYukle } from "@/lib/gorsel-yukle";
import { prisma } from "@/lib/prisma";
import { requireRol } from "@/lib/rbac";
import { slugla } from "@/lib/slug";
import { kurumSemasi } from "@/lib/validations/taksonomi";

const ROLLER = ["ADMIN", "EDITOR"] as const;

export interface KurumFormDurumu {
  hata?: string;
  alanHatalari?: Record<string, string>;
}

export async function kurumKaydet(
  _oncekiDurum: KurumFormDurumu | undefined,
  formData: FormData,
): Promise<KurumFormDurumu> {
  const oturum = await requireRol(ROLLER);
  const id = (formData.get("id") as string) || undefined;

  const ayristirilmis = kurumSemasi.safeParse({
    ad: formData.get("ad"),
    slug: formData.get("slug"),
    tipId: formData.get("tipId"),
    webSitesi: formData.get("webSitesi"),
    aciklamaMd: formData.get("aciklamaMd"),
    sira: formData.get("sira"),
    aktifMi: formData.get("aktifMi"),
  });

  if (!ayristirilmis.success) {
    const alanHatalari: Record<string, string> = {};
    for (const sorun of ayristirilmis.error.issues) {
      alanHatalari[String(sorun.path[0])] = sorun.message;
    }
    return { alanHatalari };
  }

  const veri = ayristirilmis.data;
  const slug = veri.slug ?? slugla(veri.ad);

  // §7: logo yeniden kodlanır, EXIF/konum verisi düşer.
  let logoUrl: string | undefined;
  const logo = formData.get("logo");
  if (logo instanceof File && logo.size > 0) {
    try {
      logoUrl = await gorselYukle(logo, slug, {
        klasor: "logolar",
        genislik: 400,
        yukseklik: 400,
      });
    } catch (hata) {
      return { hata: hata instanceof Error ? hata.message : "Logo yüklenemedi." };
    }
  }

  const ortak = {
    ad: veri.ad,
    slug,
    tipId: veri.tipId,
    webSitesi: veri.webSitesi ?? null,
    aciklamaMd: veri.aciklamaMd ?? null,
    sira: veri.sira,
    aktifMi: veri.aktifMi,
  };

  try {
    if (id) {
      const oncesi = await prisma.kurum.findUnique({ where: { id } });
      if (!oncesi) return { hata: "Kurum bulunamadı." };

      const sonrasi = await prisma.kurum.update({
        where: { id },
        data: { ...ortak, ...(logoUrl ? { logoUrl } : {}) },
      });

      await denetimYaz({
        adminId: oturum.kullaniciId,
        eylem: "GUNCELLE",
        varlik: "Kurum",
        varlikId: id,
        oncesi,
        sonrasi,
      });
    } else {
      const olusturulan = await prisma.kurum.create({
        data: { ...ortak, logoUrl: logoUrl ?? null },
      });

      await denetimYaz({
        adminId: oturum.kullaniciId,
        eylem: "OLUSTUR",
        varlik: "Kurum",
        varlikId: olusturulan.id,
        sonrasi: olusturulan,
      });
    }
  } catch (hata) {
    if (hata instanceof Prisma.PrismaClientKnownRequestError && hata.code === "P2002") {
      return { alanHatalari: { slug: "Bu slug zaten kullanılıyor." } };
    }
    throw hata;
  }

  revalidatePath("/yonetim/kurumlar");
  revalidatePath("/");
  redirect("/yonetim/kurumlar");
}

export async function kurumSil(id: string): Promise<{ hata?: string }> {
  const oturum = await requireRol(ROLLER);

  // İlanı olan kurum silinemez — ilan zorunlu FK ile kuruma bağlı.
  const ilanSayisi = await prisma.ilan.count({ where: { kurumId: id } });
  if (ilanSayisi > 0) {
    return {
      hata: `Bu kurumun ${ilanSayisi} ilanı var. Önce ilanları silin veya başka kuruma taşıyın.`,
    };
  }

  const silinen = await prisma.kurum.delete({ where: { id } });

  await denetimYaz({
    adminId: oturum.kullaniciId,
    eylem: "SIL",
    varlik: "Kurum",
    varlikId: id,
    oncesi: silinen,
  });

  revalidatePath("/yonetim/kurumlar");
  return {};
}
