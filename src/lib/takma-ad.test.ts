import { describe, expect, it } from "vitest";
import { benzersizTakmaAd, takmaAdUret } from "@/lib/takma-ad";

describe("takmaAdUret", () => {
  it("sıfat + isim + sayı biçiminde üretir", () => {
    expect(takmaAdUret(() => 0)).toMatch(/^\S+ \S+ \d{2}$/);
  });

  it("sayı 10–99 aralığında kalır", () => {
    for (const deger of [0, 0.5, 0.999999]) {
      const sayi = Number(
        takmaAdUret(() => deger)
          .split(" ")
          .at(-1),
      );
      expect(sayi).toBeGreaterThanOrEqual(10);
      expect(sayi).toBeLessThanOrEqual(99);
    }
  });

  it("aynı rastgelelikle aynı sonucu verir (deterministik)", () => {
    expect(takmaAdUret(() => 0.25)).toBe(takmaAdUret(() => 0.25));
  });
});

describe("benzersizTakmaAd", () => {
  it("kullanımda olmayan ilk adayı döndürür", async () => {
    const ad = await benzersizTakmaAd(async () => false);
    expect(ad).toMatch(/^\S+ \S+ \d{2}$/);
  });

  it("çakışma varsa yeni aday dener", async () => {
    let cagri = 0;
    const ad = await benzersizTakmaAd(async () => {
      cagri += 1;
      return cagri < 3; // ilk iki aday dolu
    });
    expect(cagri).toBe(3);
    expect(ad).toBeTruthy();
  });

  it("havuz tükenirse zaman damgalı ada düşer", async () => {
    const ad = await benzersizTakmaAd(async () => true);
    // Son çare dalı 6 haneli zaman damgası kullanır.
    expect(ad).toMatch(/^\S+ \S+ \d{6}$/);
  });
});
