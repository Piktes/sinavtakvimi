"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { IZINLI_OFSETLER, type AbonelikDurumu, type AbonelikHedefi } from "@/lib/abonelik";
import { prisma } from "@/lib/prisma";
import { uyeVarsa } from "@/lib/rbac";

const girdiSemasi = z.object({
  hedef: z.enum(["ilan", "kurum", "koleksiyon"]),
  hedefId: z.string().min(1),
  ofsetler: z
    .array(z.number().int())
    .transform((liste) =>
      [...new Set(liste)].filter((o) => IZINLI_OFSETLER.includes(o as never)).sort((a, b) => b - a),
    ),
});

function hedefAlani(hedef: AbonelikHedefi, id: string) {
  return hedef === "ilan"
    ? { ilanId: id }
    : hedef === "kurum"
      ? { kurumId: id }
      : { koleksiyonId: id };
}

// Hedefin gerçekten var ve görünür olduğunu doğrular. Aksi hâlde istemciden
// gelen rastgele bir id ile yetim abonelik kaydı oluşturulabilirdi.
async function hedefGecerliMi(hedef: AbonelikHedefi, id: string): Promise<boolean> {
  if (hedef === "ilan") {
    return (await prisma.ilan.count({ where: { id, yayinDurumu: "YAYINDA" } })) > 0;
  }
  if (hedef === "kurum") {
    return (await prisma.kurum.count({ where: { id, aktifMi: true } })) > 0;
  }
  return (await prisma.koleksiyon.count({ where: { id, aktifMi: true } })) > 0;
}

export async function aboneOl(girdi: {
  hedef: AbonelikHedefi;
  hedefId: string;
  ofsetler: number[];
}): Promise<AbonelikDurumu> {
  const ayristirilmis = girdiSemasi.safeParse(girdi);
  if (!ayristirilmis.success) {
    return { aboneMi: false, ofsetler: [], hata: "Geçersiz istek." };
  }

  const uye = await uyeVarsa();
  if (!uye) return { aboneMi: false, ofsetler: [], girisGerekli: true };

  // §4.8: doğrulanmamış adrese bildirim gitmez, o hâlde abonelik de açılmasın —
  // kullanıcı hatırlatma beklerken sessizce hiçbir şey almamalı.
  if (!uye.epostaDogrulandi) {
    return {
      aboneMi: false,
      ofsetler: [],
      hata: "Bildirim alabilmek için önce e-posta adresinizi doğrulayın.",
    };
  }

  const { hedef, hedefId, ofsetler } = ayristirilmis.data;
  if (!(await hedefGecerliMi(hedef, hedefId))) {
    return { aboneMi: false, ofsetler: [], hata: "Bu içerik artık yayında değil." };
  }

  const alan = hedefAlani(hedef, hedefId);

  // Aynı hedefe ikinci kez basmak hata değil, ofset güncellemesi olmalı.
  const mevcut = await prisma.abonelik.findFirst({
    where: { kullaniciId: uye.kullaniciId, ...alan },
    select: { id: true },
  });

  const kayit = mevcut
    ? await prisma.abonelik.update({
        where: { id: mevcut.id },
        data: { ofsetler, aktifMi: true },
        select: { ofsetler: true },
      })
    : await prisma.abonelik.create({
        data: { kullaniciId: uye.kullaniciId, ...alan, ofsetler },
        select: { ofsetler: true },
      });

  revalidatePath("/hesabim");
  return { aboneMi: true, ofsetler: kayit.ofsetler };
}

export async function abonelikKapat(girdi: {
  hedef: AbonelikHedefi;
  hedefId: string;
}): Promise<AbonelikDurumu> {
  const uye = await uyeVarsa();
  if (!uye) return { aboneMi: false, ofsetler: [], girisGerekli: true };

  const ayristirilmis = girdiSemasi
    .omit({ ofsetler: true })
    .safeParse({ hedef: girdi.hedef, hedefId: girdi.hedefId });
  if (!ayristirilmis.success) return { aboneMi: false, ofsetler: [], hata: "Geçersiz istek." };

  // Planlanmış gönderimler `Gonderim` kaydıyla birlikte cascade siliniyor;
  // kullanıcı "kapalı"yı seçtiğinde bekleyen bir e-posta kalmamalı.
  await prisma.abonelik.deleteMany({
    where: {
      kullaniciId: uye.kullaniciId,
      ...hedefAlani(ayristirilmis.data.hedef, ayristirilmis.data.hedefId),
    },
  });

  revalidatePath("/hesabim");
  return { aboneMi: false, ofsetler: [] };
}

/**
 * Sunucu bileşenlerinin düğmeye başlangıç durumu verebilmesi için.
 * Girişsiz kullanıcıda `girisGerekli` döner — düğme yine görünür, tıklayınca
 * giriş sayfasına yönlendirir (§4.8'in "kapalı" seviyesi bu değil; kapalı,
 * girişli kullanıcının kaydının olmaması demek).
 */
export async function abonelikDurumu(
  hedef: AbonelikHedefi,
  hedefId: string,
): Promise<AbonelikDurumu> {
  const uye = await uyeVarsa();
  if (!uye) return { aboneMi: false, ofsetler: [], girisGerekli: true };

  const kayit = await prisma.abonelik.findFirst({
    where: { kullaniciId: uye.kullaniciId, ...hedefAlani(hedef, hedefId) },
    select: { ofsetler: true, aktifMi: true },
  });

  if (!kayit || !kayit.aktifMi) return { aboneMi: false, ofsetler: [] };
  return { aboneMi: true, ofsetler: kayit.ofsetler };
}
