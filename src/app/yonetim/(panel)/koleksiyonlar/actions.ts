"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";
import { denetimYaz } from "@/lib/denetim";
import { prisma } from "@/lib/prisma";
import { requireRol } from "@/lib/rbac";
import { slugla } from "@/lib/slug";
import { koleksiyonSemasi } from "@/lib/validations/taksonomi";
import { koleksiyonFiltresiSemasi } from "@/lib/validations/koleksiyon";
import { filtreyiWhereCevir } from "@/lib/veri/ilan";

const ROLLER = ["ADMIN", "EDITOR"] as const;

export interface KoleksiyonFormDurumu {
  hata?: string;
  alanHatalari?: Record<string, string>;
}

// §6: "canlı önizleme — bu filtre şu an 47 ilan getiriyor". Önizleme ile
// gerçek sorgu AYNI fonksiyonu (filtreyiWhereCevir) kullanır; ikinci bir
// yorum yazılmaz, yoksa önizleme yalan söyleyebilir.
export async function filtreOnizle(
  filtreJson: string,
): Promise<{ adet: number; ornekler: string[]; hata?: string }> {
  await requireRol(ROLLER);

  let ham: unknown;
  try {
    ham = JSON.parse(filtreJson);
  } catch {
    return { adet: 0, ornekler: [], hata: "Filtre okunamadı." };
  }

  const ayristirilmis = koleksiyonFiltresiSemasi.safeParse(ham);
  if (!ayristirilmis.success) return { adet: 0, ornekler: [], hata: "Filtre geçersiz." };

  const where = {
    yayinDurumu: "YAYINDA" as const,
    ...filtreyiWhereCevir(ayristirilmis.data),
  };

  const [adet, ornekler] = await Promise.all([
    prisma.ilan.count({ where }),
    prisma.ilan.findMany({
      where,
      select: { baslik: true },
      orderBy: { sinavTarihi: "asc" },
      take: 5,
    }),
  ]);

  return { adet, ornekler: ornekler.map((i) => i.baslik) };
}

export async function koleksiyonKaydet(
  _oncekiDurum: KoleksiyonFormDurumu | undefined,
  formData: FormData,
): Promise<KoleksiyonFormDurumu> {
  const oturum = await requireRol(ROLLER);
  const id = (formData.get("id") as string) || undefined;

  const ayristirilmis = koleksiyonSemasi.safeParse({
    ad: formData.get("ad"),
    slug: formData.get("slug"),
    sira: formData.get("sira"),
    aktifMi: formData.get("aktifMi"),
    ikon: formData.get("ikon"),
    varsayilanGorunum: formData.get("varsayilanGorunum"),
    menudeMi: formData.get("menudeMi"),
    anaSayfadaMi: formData.get("anaSayfadaMi"),
  });

  if (!ayristirilmis.success) {
    const alanHatalari: Record<string, string> = {};
    for (const sorun of ayristirilmis.error.issues) {
      alanHatalari[String(sorun.path[0])] = sorun.message;
    }
    return { alanHatalari };
  }

  // Filtre jsonb'si serbest değil — kaydetmeden önce Zod'dan geçer.
  let filtreHam: unknown;
  try {
    filtreHam = JSON.parse((formData.get("filtreJson") as string) || "{}");
  } catch {
    return { hata: "Filtre okunamadı." };
  }
  const filtre = koleksiyonFiltresiSemasi.safeParse(filtreHam);
  if (!filtre.success) return { hata: "Filtre geçersiz." };

  const veri = ayristirilmis.data;
  const slug = veri.slug ?? slugla(veri.ad);

  const ortak = {
    ad: veri.ad,
    slug,
    sira: veri.sira,
    aktifMi: veri.aktifMi,
    ikon: veri.ikon ?? null,
    varsayilanGorunum: veri.varsayilanGorunum,
    menudeMi: veri.menudeMi,
    anaSayfadaMi: veri.anaSayfadaMi,
    filtre: filtre.data,
  };

  try {
    if (id) {
      const oncesi = await prisma.koleksiyon.findUnique({ where: { id } });
      if (!oncesi) return { hata: "Koleksiyon bulunamadı." };

      const sonrasi = await prisma.koleksiyon.update({ where: { id }, data: ortak });
      await denetimYaz({
        adminId: oturum.kullaniciId,
        eylem: "GUNCELLE",
        varlik: "Koleksiyon",
        varlikId: id,
        oncesi,
        sonrasi,
      });
    } else {
      const olusturulan = await prisma.koleksiyon.create({ data: ortak });
      await denetimYaz({
        adminId: oturum.kullaniciId,
        eylem: "OLUSTUR",
        varlik: "Koleksiyon",
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

  revalidatePath("/yonetim/koleksiyonlar");
  // Üst menü sekmeleri buradan geliyor — genel site de tazelenmeli.
  revalidatePath("/", "layout");
  redirect("/yonetim/koleksiyonlar");
}

export async function koleksiyonSil(id: string): Promise<{ hata?: string }> {
  const oturum = await requireRol(ROLLER);

  const silinen = await prisma.koleksiyon.delete({ where: { id } });

  await denetimYaz({
    adminId: oturum.kullaniciId,
    eylem: "SIL",
    varlik: "Koleksiyon",
    varlikId: id,
    oncesi: silinen,
  });

  revalidatePath("/yonetim/koleksiyonlar");
  revalidatePath("/", "layout");
  return {};
}
