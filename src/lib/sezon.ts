import { gunAnahtari } from "@/lib/tarih";

// §2: `sezon` boşsa `sinavTarihi`'nden türetilir, kesme noktası 1 Ağustos.
// 30.10.2026 → "2026-2027" · 15.03.2026 → "2025-2026"
export function sezonTuret(sinavTarihi: Date): string {
  const [yil, ay] = gunAnahtari(sinavTarihi).split("-").map(Number);
  const baslangicYili = ay >= 8 ? yil : yil - 1;
  return `${baslangicYili}-${baslangicYili + 1}`;
}
