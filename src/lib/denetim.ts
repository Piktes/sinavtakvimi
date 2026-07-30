import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

// §7 KVKK: ham IP asla saklanmaz, yalnızca tuzlanmış hash.
async function ipHash(): Promise<string | null> {
  const tuz = process.env.IP_HASH_SALT;
  if (!tuz) return null;

  const basliklar = await headers();
  const ham =
    basliklar.get("x-forwarded-for")?.split(",")[0]?.trim() ?? basliklar.get("x-real-ip") ?? "";
  if (!ham) return null;

  return createHash("sha256").update(`${tuz}:${ham}`).digest("hex");
}

interface DenetimGirdisi {
  adminId: string;
  eylem: "OLUSTUR" | "GUNCELLE" | "SIL" | "YAYINLA" | "GIRIS";
  varlik: string;
  varlikId: string;
  oncesi?: unknown;
  sonrasi?: unknown;
}

// §6 Sistem: denetim kaydı DEĞİŞTİRİLEMEZ. Tüm mutasyonlar tek bu yardımcıdan
// geçer; hiçbir action kendi prisma.denetimKaydi.create çağrısını yapmaz.
export async function denetimYaz(girdi: DenetimGirdisi): Promise<void> {
  await prisma.denetimKaydi.create({
    data: {
      adminId: girdi.adminId,
      eylem: girdi.eylem,
      varlik: girdi.varlik,
      varlikId: girdi.varlikId,
      oncesi: girdi.oncesi === undefined ? undefined : (girdi.oncesi as object),
      sonrasi: girdi.sonrasi === undefined ? undefined : (girdi.sonrasi as object),
      ipHash: await ipHash(),
    },
  });
}
