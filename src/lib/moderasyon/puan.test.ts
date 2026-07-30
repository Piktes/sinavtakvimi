import { describe, expect, it } from "vitest";
import { esigeKalan, ortalamaGosterilir, ortalamaHesapla, PUAN_ESIGI } from "@/lib/moderasyon/puan";

describe("ortalamaGosterilir", () => {
  it("eşiğin altında gizler", () => {
    expect(ortalamaGosterilir(0)).toBe(false);
    expect(ortalamaGosterilir(PUAN_ESIGI - 1)).toBe(false);
  });

  it("eşikte ve üstünde gösterir", () => {
    expect(ortalamaGosterilir(PUAN_ESIGI)).toBe(true);
    expect(ortalamaGosterilir(PUAN_ESIGI + 10)).toBe(true);
  });
});

describe("esigeKalan", () => {
  it("kalan sayıyı verir", () => {
    expect(esigeKalan(2)).toBe(PUAN_ESIGI - 2);
  });

  it("eşik aşıldığında sıfır döner, negatif değil", () => {
    expect(esigeKalan(PUAN_ESIGI + 3)).toBe(0);
  });
});

describe("ortalamaHesapla", () => {
  it("boş listede null döner", () => {
    expect(ortalamaHesapla([])).toBeNull();
  });

  it("tek puanda o puanı verir", () => {
    expect(ortalamaHesapla([4])).toBe(4);
  });

  it("bir ondalığa yuvarlar", () => {
    expect(ortalamaHesapla([5, 4, 4])).toBe(4.3);
  });

  it("tam bölünen ortalamayı tam sayı verir", () => {
    expect(ortalamaHesapla([2, 4])).toBe(3);
  });

  it("uç puanları doğru ortalar", () => {
    expect(ortalamaHesapla([1, 1, 5, 5])).toBe(3);
  });
});
