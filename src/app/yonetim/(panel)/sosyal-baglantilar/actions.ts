"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";
import { denetimYaz } from "@/lib/denetim";
import { prisma } from "@/lib/prisma";
import { requireRol } from "@/lib/rbac";
import { sosyalBaglantiSemasi } from "@/lib/validations/sosyal";

const ROLLER = ["ADMIN", "EDITOR"] as const;

export interface SosyalFormDurumu {
  hata?: string;
  alanHatalari?: Record<string, string>;
}

export async function sosyalBaglantiKaydet(
  _oncekiDurum: SosyalFormDurumu | undefined,
  formData: FormData,
): Promise<SosyalFormDurumu> {
  const oturum = await requireRol(ROLLER);
  const id = (formData.get("id") as string) || undefined;

  const ayristirilmis = sosyalBaglantiSemasi.safeParse({
    platform: formData.get("platform"),
    url: formData.get("url"),
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

  try {
    if (id) {
      const oncesi = await prisma.sosyalBaglanti.findUnique({ where: { id } });
      if (!oncesi) return { hata: "Bağlantı bulunamadı." };

      const sonrasi = await prisma.sosyalBaglanti.update({ where: { id }, data: veri });

      await denetimYaz({
        adminId: oturum.kullaniciId,
        eylem: "GUNCELLE",
        varlik: "SosyalBaglanti",
        varlikId: id,
        oncesi,
        sonrasi,
      });
    } else {
      const olusturulan = await prisma.sosyalBaglanti.create({ data: veri });

      await denetimYaz({
        adminId: oturum.kullaniciId,
        eylem: "OLUSTUR",
        varlik: "SosyalBaglanti",
        varlikId: olusturulan.id,
        sonrasi: olusturulan,
      });
    }
  } catch (hata) {
    if (hata instanceof Prisma.PrismaClientKnownRequestError && hata.code === "P2002") {
      return { alanHatalari: { platform: "Bu platform için zaten bir bağlantı var." } };
    }
    throw hata;
  }

  revalidatePath("/yonetim/sosyal-baglantilar");
  revalidatePath("/", "layout");
  redirect("/yonetim/sosyal-baglantilar");
}

export async function sosyalBaglantiSil(id: string): Promise<{ hata?: string }> {
  const oturum = await requireRol(ROLLER);

  const silinen = await prisma.sosyalBaglanti.delete({ where: { id } });

  await denetimYaz({
    adminId: oturum.kullaniciId,
    eylem: "SIL",
    varlik: "SosyalBaglanti",
    varlikId: id,
    oncesi: silinen,
  });

  revalidatePath("/yonetim/sosyal-baglantilar");
  revalidatePath("/", "layout");
  return {};
}
