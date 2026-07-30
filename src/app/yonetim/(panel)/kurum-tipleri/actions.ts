"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { denetimYaz } from "@/lib/denetim";
import { prisma } from "@/lib/prisma";
import { requireRol } from "@/lib/rbac";
import { slugla } from "@/lib/slug";
import { kurumTipiSemasi } from "@/lib/validations/taksonomi";

const ROLLER = ["ADMIN", "EDITOR"] as const;

export interface KurumTipiDurumu {
  hata?: string;
  basari?: string;
}

// §2: "KurumTipi ← admin yeni tip ekleyebilir, enum DEĞİL." Bu ekran o
// kararın karşılığı: yeni bir kurum türü için migration gerekmiyor.
export async function kurumTipiKaydet(
  _oncekiDurum: KurumTipiDurumu | undefined,
  formData: FormData,
): Promise<KurumTipiDurumu> {
  const oturum = await requireRol(ROLLER);
  const id = (formData.get("id") as string) || undefined;

  const ayristirilmis = kurumTipiSemasi.safeParse({
    ad: formData.get("ad"),
    slug: formData.get("slug"),
    sira: formData.get("sira"),
    aktifMi: formData.get("aktifMi"),
  });

  if (!ayristirilmis.success) {
    return { hata: ayristirilmis.error.issues[0]?.message ?? "Geçersiz veri." };
  }

  const veri = ayristirilmis.data;
  const ortak = {
    ad: veri.ad,
    slug: veri.slug ?? slugla(veri.ad),
    sira: veri.sira,
    aktifMi: veri.aktifMi,
  };

  try {
    if (id) {
      const oncesi = await prisma.kurumTipi.findUnique({ where: { id } });
      if (!oncesi) return { hata: "Kurum tipi bulunamadı." };

      const sonrasi = await prisma.kurumTipi.update({ where: { id }, data: ortak });
      await denetimYaz({
        adminId: oturum.kullaniciId,
        eylem: "GUNCELLE",
        varlik: "KurumTipi",
        varlikId: id,
        oncesi,
        sonrasi,
      });
    } else {
      const olusturulan = await prisma.kurumTipi.create({ data: ortak });
      await denetimYaz({
        adminId: oturum.kullaniciId,
        eylem: "OLUSTUR",
        varlik: "KurumTipi",
        varlikId: olusturulan.id,
        sonrasi: olusturulan,
      });
    }
  } catch (hata) {
    if (hata instanceof Prisma.PrismaClientKnownRequestError && hata.code === "P2002") {
      return { hata: "Bu slug zaten kullanılıyor." };
    }
    throw hata;
  }

  revalidatePath("/yonetim/kurum-tipleri");
  revalidatePath("/yonetim/kurumlar");
  return { basari: id ? "Güncellendi." : "Eklendi." };
}

export async function kurumTipiSil(id: string): Promise<{ hata?: string }> {
  const oturum = await requireRol(ROLLER);

  const kurumSayisi = await prisma.kurum.count({ where: { tipId: id } });
  if (kurumSayisi > 0) {
    return { hata: `Bu tipte ${kurumSayisi} kurum var, silinemez. Pasife alabilirsiniz.` };
  }

  const silinen = await prisma.kurumTipi.delete({ where: { id } });

  await denetimYaz({
    adminId: oturum.kullaniciId,
    eylem: "SIL",
    varlik: "KurumTipi",
    varlikId: id,
    oncesi: silinen,
  });

  revalidatePath("/yonetim/kurum-tipleri");
  return {};
}
