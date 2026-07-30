"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { denetimYaz } from "@/lib/denetim";
import { gorselYukle } from "@/lib/gorsel-yukle";
import { prisma } from "@/lib/prisma";
import { requireRol } from "@/lib/rbac";
import { hikayeSemasi } from "@/lib/validations/hikaye";

const ROLLER = ["ADMIN", "EDITOR"] as const;

export interface HikayeFormDurumu {
  hata?: string;
  alanHatalari?: Record<string, string>;
}

export async function hikayeKaydet(
  _oncekiDurum: HikayeFormDurumu | undefined,
  formData: FormData,
): Promise<HikayeFormDurumu> {
  const oturum = await requireRol(ROLLER);
  const id = (formData.get("id") as string) || undefined;

  const ayristirilmis = hikayeSemasi.safeParse({
    baslik: formData.get("baslik"),
    baglanti: formData.get("baglanti"),
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

  // §7: görsel yeniden kodlanır, EXIF/konum verisi düşer. Instagram
  // hikayesi oranına yakın dikey kırpma (9:16).
  let gorselUrl: string | undefined;
  const gorsel = formData.get("gorsel");
  if (gorsel instanceof File && gorsel.size > 0) {
    try {
      gorselUrl = await gorselYukle(gorsel, "hikaye", {
        klasor: "hikayeler",
        genislik: 720,
        yukseklik: 1280,
      });
    } catch (hata) {
      return { hata: hata instanceof Error ? hata.message : "Görsel yüklenemedi." };
    }
  }

  if (!id && !gorselUrl) {
    return { alanHatalari: { gorsel: "Görsel zorunlu." } };
  }

  const ortak = {
    baslik: veri.baslik,
    baglanti: veri.baglanti ?? null,
    sira: veri.sira,
    aktifMi: veri.aktifMi,
  };

  if (id) {
    const oncesi = await prisma.hikaye.findUnique({ where: { id } });
    if (!oncesi) return { hata: "Hikaye bulunamadı." };

    const sonrasi = await prisma.hikaye.update({
      where: { id },
      data: { ...ortak, ...(gorselUrl ? { gorselUrl } : {}) },
    });

    await denetimYaz({
      adminId: oturum.kullaniciId,
      eylem: "GUNCELLE",
      varlik: "Hikaye",
      varlikId: id,
      oncesi,
      sonrasi,
    });
  } else {
    const olusturulan = await prisma.hikaye.create({
      data: { ...ortak, gorselUrl: gorselUrl! },
    });

    await denetimYaz({
      adminId: oturum.kullaniciId,
      eylem: "OLUSTUR",
      varlik: "Hikaye",
      varlikId: olusturulan.id,
      sonrasi: olusturulan,
    });
  }

  revalidatePath("/yonetim/hikayeler");
  revalidatePath("/");
  redirect("/yonetim/hikayeler");
}

export async function hikayeSil(id: string): Promise<{ hata?: string }> {
  const oturum = await requireRol(ROLLER);

  const silinen = await prisma.hikaye.delete({ where: { id } });

  await denetimYaz({
    adminId: oturum.kullaniciId,
    eylem: "SIL",
    varlik: "Hikaye",
    varlikId: id,
    oncesi: silinen,
  });

  revalidatePath("/yonetim/hikayeler");
  revalidatePath("/");
  return {};
}
