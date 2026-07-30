import "server-only";
import { prisma } from "@/lib/prisma";
import { ortalamaHesapla } from "@/lib/moderasyon/puan";

// §2: `Ilan.puanOrtalama` / `puanSayisi` DENORMALİZE alanlar — ortalama her
// istekte AVG ile hesaplanmasın diye. §4.9 bunların YALNIZCA ONAYLI
// yorumlardan hesaplanmasını şart koşuyor.
//
// Tek giriş noktası: yorum durumu değiştiren her yol buradan geçer. İkinci
// bir hesaplama yazılsaydı biri onaylı-dışı puanları da sayabilirdi ve fark
// hiçbir yerde görünmezdi.
export async function puanlariYenidenHesapla(ilanId: string): Promise<{
  puanOrtalama: number | null;
  puanSayisi: number;
}> {
  const puanlar = await prisma.yorum.findMany({
    where: { ilanId, durum: "ONAYLANDI", puan: { not: null } },
    select: { puan: true },
  });

  const degerler = puanlar.map((satir) => satir.puan!);
  const puanOrtalama = ortalamaHesapla(degerler);
  const puanSayisi = degerler.length;

  await prisma.ilan.update({
    where: { id: ilanId },
    data: { puanOrtalama, puanSayisi },
  });

  return { puanOrtalama, puanSayisi };
}
