import { describe, expect, it } from "vitest";
import { tarihDegistiMi } from "@/lib/bildirim/zamanlama";

const gun = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

describe("tarihDegistiMi", () => {
  it("farklı günü değişiklik sayar", () => {
    expect(tarihDegistiMi(gun("2026-04-12"), gun("2026-04-19"))).toBe(true);
  });

  it("aynı günü değişiklik saymaz", () => {
    expect(tarihDegistiMi(gun("2026-04-12"), gun("2026-04-12"))).toBe(false);
  });

  it("aynı gün içindeki saat farkını değişiklik saymaz", () => {
    // @db.Date sütunları UTC gece yarısı gelir, ama başka bir yol saatli bir
    // Date üretirse gün aynı kaldığı sürece bildirim gitmemeli.
    expect(tarihDegistiMi(new Date("2026-04-12T00:00:00Z"), new Date("2026-04-12T13:45:00Z"))).toBe(
      false,
    );
  });

  it("null değerlerde değişiklik yok sayar", () => {
    expect(tarihDegistiMi(null, gun("2026-04-12"))).toBe(false);
    expect(tarihDegistiMi(gun("2026-04-12"), null)).toBe(false);
    expect(tarihDegistiMi(null, null)).toBe(false);
  });

  it("geriye alınan tarihi de değişiklik sayar", () => {
    expect(tarihDegistiMi(gun("2026-04-19"), gun("2026-04-12"))).toBe(true);
  });

  it("yıl sınırını aşan değişikliği yakalar", () => {
    expect(tarihDegistiMi(gun("2026-12-31"), gun("2027-01-01"))).toBe(true);
  });
});
