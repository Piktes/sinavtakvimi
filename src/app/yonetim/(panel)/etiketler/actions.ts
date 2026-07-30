"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { denetimYaz } from "@/lib/denetim";
import { prisma } from "@/lib/prisma";
import { requireRol } from "@/lib/rbac";
import { slugla } from "@/lib/slug";
import { etiketSemasi } from "@/lib/validations/taksonomi";

const ROLLER = ["ADMIN", "EDITOR"] as const;

export interface EtiketDurumu {
  hata?: string;
  basari?: string;
}

function yolTazele() {
  revalidatePath("/yonetim/etiketler");
  // Etiketler üst menüyü ve filtre seçeneklerini besliyor.
  revalidatePath("/", "layout");
}

export async function etiketKaydet(
  _oncekiDurum: EtiketDurumu | undefined,
  formData: FormData,
): Promise<EtiketDurumu> {
  const oturum = await requireRol(ROLLER);
  const id = (formData.get("id") as string) || undefined;

  const ayristirilmis = etiketSemasi.safeParse({
    tip: formData.get("tip"),
    ad: formData.get("ad"),
    slug: formData.get("slug"),
    kisaAd: formData.get("kisaAd"),
    sira: formData.get("sira"),
    aktifMi: formData.get("aktifMi"),
  });

  if (!ayristirilmis.success) {
    return { hata: ayristirilmis.error.issues[0]?.message ?? "Geçersiz veri." };
  }

  const veri = ayristirilmis.data;
  const slug = veri.slug ?? slugla(veri.ad);

  const ortak = {
    tip: veri.tip,
    ad: veri.ad,
    slug,
    kisaAd: veri.kisaAd ?? null,
    sira: veri.sira,
    aktifMi: veri.aktifMi,
  };

  try {
    if (id) {
      const oncesi = await prisma.etiket.findUnique({ where: { id } });
      if (!oncesi) return { hata: "Etiket bulunamadı." };

      const sonrasi = await prisma.etiket.update({ where: { id }, data: ortak });
      await denetimYaz({
        adminId: oturum.kullaniciId,
        eylem: "GUNCELLE",
        varlik: "Etiket",
        varlikId: id,
        oncesi,
        sonrasi,
      });
    } else {
      const olusturulan = await prisma.etiket.create({ data: ortak });
      await denetimYaz({
        adminId: oturum.kullaniciId,
        eylem: "OLUSTUR",
        varlik: "Etiket",
        varlikId: olusturulan.id,
        sonrasi: olusturulan,
      });
    }
  } catch (hata) {
    // @@unique([tip, slug]) — aynı tip içinde slug tekrar edemez.
    if (hata instanceof Prisma.PrismaClientKnownRequestError && hata.code === "P2002") {
      return { hata: `Bu tipte "${slug}" slug'ı zaten var.` };
    }
    throw hata;
  }

  yolTazele();
  return { basari: id ? "Güncellendi." : "Eklendi." };
}

export async function etiketSil(id: string): Promise<{ hata?: string }> {
  const oturum = await requireRol(ROLLER);

  // Kullanımdaki etiket silinemez: ilan grup/format'a zorunlu FK ile bağlı,
  // düzey ise çoka-çok. Üçünü de sayıp engelliyoruz.
  const [grupSayisi, formatSayisi, duzeySayisi] = await Promise.all([
    prisma.ilan.count({ where: { grupId: id } }),
    prisma.ilan.count({ where: { formatId: id } }),
    prisma.ilan.count({ where: { duzeyler: { some: { id } } } }),
  ]);

  const toplam = grupSayisi + formatSayisi + duzeySayisi;
  if (toplam > 0) {
    return { hata: `Bu etiket ${toplam} ilanda kullanılıyor, silinemez. Pasife alabilirsiniz.` };
  }

  const silinen = await prisma.etiket.delete({ where: { id } });

  await denetimYaz({
    adminId: oturum.kullaniciId,
    eylem: "SIL",
    varlik: "Etiket",
    varlikId: id,
    oncesi: silinen,
  });

  yolTazele();
  return {};
}
