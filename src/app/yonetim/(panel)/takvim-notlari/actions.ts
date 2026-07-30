"use server";

import { revalidatePath } from "next/cache";
import { denetimYaz } from "@/lib/denetim";
import { prisma } from "@/lib/prisma";
import { requireRol } from "@/lib/rbac";
import { takvimNotuSemasi } from "@/lib/validations/taksonomi";

const ROLLER = ["ADMIN", "EDITOR"] as const;

export interface TakvimNotuDurumu {
  hata?: string;
  basari?: string;
}

// "YYYY-MM-DD" → @db.Date için UTC gece yarısı.
function gun(deger: string): Date {
  return new Date(`${deger}T00:00:00.000Z`);
}

function yolTazele() {
  revalidatePath("/yonetim/takvim-notlari");
  // Notlar aylık ızgarada bant olarak görünüyor.
  revalidatePath("/takvim");
}

export async function takvimNotuKaydet(
  _oncekiDurum: TakvimNotuDurumu | undefined,
  formData: FormData,
): Promise<TakvimNotuDurumu> {
  const oturum = await requireRol(ROLLER);
  const id = (formData.get("id") as string) || undefined;

  const ayristirilmis = takvimNotuSemasi.safeParse({
    ad: formData.get("ad"),
    baslangic: formData.get("baslangic"),
    bitis: formData.get("bitis"),
    tip: formData.get("tip"),
    aciklama: formData.get("aciklama"),
    aktifMi: formData.get("aktifMi"),
  });

  if (!ayristirilmis.success) {
    return { hata: ayristirilmis.error.issues[0]?.message ?? "Geçersiz veri." };
  }

  const veri = ayristirilmis.data;
  const ortak = {
    ad: veri.ad,
    baslangic: gun(veri.baslangic),
    bitis: gun(veri.bitis),
    tip: veri.tip,
    aciklama: veri.aciklama ?? null,
    aktifMi: veri.aktifMi,
  };

  if (id) {
    const oncesi = await prisma.takvimNotu.findUnique({ where: { id } });
    if (!oncesi) return { hata: "Not bulunamadı." };

    const sonrasi = await prisma.takvimNotu.update({ where: { id }, data: ortak });
    await denetimYaz({
      adminId: oturum.kullaniciId,
      eylem: "GUNCELLE",
      varlik: "TakvimNotu",
      varlikId: id,
      oncesi,
      sonrasi,
    });
  } else {
    const olusturulan = await prisma.takvimNotu.create({ data: ortak });
    await denetimYaz({
      adminId: oturum.kullaniciId,
      eylem: "OLUSTUR",
      varlik: "TakvimNotu",
      varlikId: olusturulan.id,
      sonrasi: olusturulan,
    });
  }

  yolTazele();
  return { basari: id ? "Güncellendi." : "Eklendi." };
}

export async function takvimNotuSil(id: string): Promise<{ hata?: string }> {
  const oturum = await requireRol(ROLLER);

  const silinen = await prisma.takvimNotu.delete({ where: { id } });

  await denetimYaz({
    adminId: oturum.kullaniciId,
    eylem: "SIL",
    varlik: "TakvimNotu",
    varlikId: id,
    oncesi: silinen,
  });

  yolTazele();
  return {};
}
