import { csvYaz, UTF8_BOM } from "@/lib/csv";
import { ILAN_SUTUNLARI } from "@/lib/ice-aktarma/ilan-sutunlari";
import { prisma } from "@/lib/prisma";
import { requireRol } from "@/lib/rbac";

// §4.2: kullanıcı doldurmaya boş sayfadan başlamasın — sütun başlıkları,
// açıklamalar ve örnek satırlar hazır gelsin.
//
// Şablon ÇALIŞMA ANINDA üretiliyor: kurum/etiket örnekleri panelde gerçekten
// kayıtlı olanlardan seçiliyor. Böylece indirilen dosyadaki örnek satır,
// olduğu gibi yüklendiğinde de geçerli oluyor.
export async function GET() {
  await requireRol(["ADMIN", "EDITOR"]);

  const [kurum, grup, format, duzeyler] = await Promise.all([
    prisma.kurum.findFirst({ where: { aktifMi: true }, select: { ad: true }, orderBy: { ad: "asc" } }),
    prisma.etiket.findFirst({
      where: { tip: "GRUP", aktifMi: true },
      select: { ad: true },
      orderBy: { sira: "asc" },
    }),
    prisma.etiket.findFirst({
      where: { tip: "FORMAT", aktifMi: true },
      select: { ad: true },
      orderBy: { sira: "asc" },
    }),
    prisma.etiket.findMany({
      where: { tip: "DUZEY", aktifMi: true },
      select: { ad: true },
      orderBy: { sira: "asc" },
      take: 2,
    }),
  ]);

  const basliklar = ILAN_SUTUNLARI.map((sutun) => sutun.anahtar);

  // 1. satır: her sütunun ne olduğu (kullanıcı silip kendi verisini yazar).
  const aciklamaSatiri = ILAN_SUTUNLARI.map((sutun) => {
    const izinli = sutun.izinliDegerler ? ` — izinli: ${sutun.izinliDegerler.join(" / ")}` : "";
    return `${sutun.zorunlu ? "[ZORUNLU] " : "[opsiyonel] "}${sutun.aciklama}${izinli}`;
  });

  // 2. satır: paneldeki gerçek kayıtlardan üretilmiş, doğrudan yüklenebilir örnek.
  const gercekOrnek = ILAN_SUTUNLARI.map((sutun) => {
    switch (sutun.anahtar) {
      case "kurum":
        return kurum?.ad ?? sutun.ornek;
      case "dagiticiKurum":
        return "";
      case "grup":
        return grup?.ad ?? sutun.ornek;
      case "format":
        return format?.ad ?? sutun.ornek;
      case "duzeyler":
        return duzeyler.map((d) => d.ad).join(", ") || sutun.ornek;
      default:
        return sutun.ornek;
    }
  });

  const govde = csvYaz(basliklar, [aciklamaSatiri, gercekOrnek]);

  // BOM olmadan Excel Türkçe karakterleri bozuk gösteriyor.
  return new Response(`${UTF8_BOM}${govde}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="ilan-ice-aktarma-sablonu.csv"',
      "Cache-Control": "no-store",
    },
  });
}
