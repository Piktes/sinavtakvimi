import { describe, expect, it } from "vitest";
import { kurumTonu } from "@/lib/kurum-tonu";

describe("kurumTonu", () => {
  it("aynı slug her zaman aynı tonu verir (§3.6 determinizm)", () => {
    expect(kurumTonu("ozdebir")).toBe(kurumTonu("ozdebir"));
  });

  it("farklı slug'lar genelde farklı ton üretir", () => {
    expect(kurumTonu("ozdebir")).not.toBe(kurumTonu("paraf"));
  });

  it("her zaman 0–359 aralığında kalır", () => {
    const slugler = ["ozdebir", "paraf", "bilgi-sarmal", "3d", "isler-kitabevleri", ""];
    for (const slug of slugler) {
      const ton = kurumTonu(slug);
      expect(ton).toBeGreaterThanOrEqual(0);
      expect(ton).toBeLessThan(360);
    }
  });
});
