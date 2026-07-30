"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { denetimYaz } from "@/lib/denetim";
import { puanlariYenidenHesapla } from "@/lib/moderasyon/puan-hesapla";
import { prisma } from "@/lib/prisma";
import { requireRol } from "@/lib/rbac";

// §6: yorum modülüne ADMIN ve MODERATOR erişir; EDITOR içerik rolüdür.
const MODERASYON_ROLLERI = ["ADMIN", "MODERATOR"] as const;

export interface ModerasyonSonucu {
  hata?: string;
  bilgi?: string;
}

const kararSemasi = z.object({
  yorumIdleri: z.array(z.string().min(1)).min(1, "Hiç yorum seçilmedi."),
  karar: z.enum(["ONAYLANDI", "REDDEDILDI", "SPAM"]),
  not: z.string().trim().max(500).optional(),
});

export async function yorumlariKararaBagla(girdi: {
  yorumIdleri: string[];
  karar: "ONAYLANDI" | "REDDEDILDI" | "SPAM";
  not?: string;
}): Promise<ModerasyonSonucu> {
  // §6: yetki hem middleware'de hem burada. Action doğrudan çağrılabilir.
  const oturum = await requireRol(MODERASYON_ROLLERI);

  const ayristirilmis = kararSemasi.safeParse(girdi);
  if (!ayristirilmis.success) {
    return { hata: ayristirilmis.error.issues[0]?.message ?? "Geçersiz istek." };
  }

  const { yorumIdleri, karar, not } = ayristirilmis.data;

  const yorumlar = await prisma.yorum.findMany({
    where: { id: { in: yorumIdleri } },
    select: { id: true, ilanId: true, durum: true, ilan: { select: { slug: true } } },
  });
  if (yorumlar.length === 0) return { hata: "Yorum bulunamadı." };

  await prisma.yorum.updateMany({
    where: { id: { in: yorumlar.map((y) => y.id) } },
    data: {
      durum: karar,
      moderatorId: oturum.kullaniciId,
      moderasyonNotu: not ?? undefined,
    },
  });

  // §4.9: ortalama YALNIZCA onaylılardan. Onay da ret de ortalamayı
  // değiştirebileceği için her iki yönde de yeniden hesaplanıyor.
  const etkilenenIlanlar = [...new Set(yorumlar.map((y) => y.ilanId))];
  for (const ilanId of etkilenenIlanlar) {
    await puanlariYenidenHesapla(ilanId);
  }

  for (const yorum of yorumlar) {
    await denetimYaz({
      adminId: oturum.kullaniciId,
      eylem: "GUNCELLE",
      varlik: "Yorum",
      varlikId: yorum.id,
      oncesi: { durum: yorum.durum },
      sonrasi: { durum: karar, moderasyonNotu: not ?? null },
    });
    revalidatePath(`/ilan/${yorum.ilan.slug}`);
  }

  revalidatePath("/yonetim/yorumlar");
  revalidatePath("/yonetim");

  const etiket = { ONAYLANDI: "onaylandı", REDDEDILDI: "reddedildi", SPAM: "spam işaretlendi" };
  return { bilgi: `${yorumlar.length} yorum ${etiket[karar]}.` };
}

export async function yorumSilKalici(yorumId: string): Promise<ModerasyonSonucu> {
  const oturum = await requireRol(MODERASYON_ROLLERI);

  const yorum = await prisma.yorum.findUnique({
    where: { id: yorumId },
    select: { id: true, ilanId: true, durum: true, ilan: { select: { slug: true } } },
  });
  if (!yorum) return { hata: "Yorum bulunamadı." };

  await prisma.yorum.delete({ where: { id: yorum.id } });
  await puanlariYenidenHesapla(yorum.ilanId);

  await denetimYaz({
    adminId: oturum.kullaniciId,
    eylem: "SIL",
    varlik: "Yorum",
    varlikId: yorum.id,
    oncesi: { durum: yorum.durum },
  });

  revalidatePath("/yonetim/yorumlar");
  revalidatePath(`/ilan/${yorum.ilan.slug}`);
  return { bilgi: "Yorum kalıcı olarak silindi." };
}
