import { describe, expect, it } from "vitest";
import { slugla } from "@/lib/slug";

describe("slugla", () => {
  it("Türkçe karakterleri ASCII'ye indirir (§7)", () => {
    expect(slugla("Çözüm Eğitim Kurumları")).toBe("cozum-egitim-kurumlari");
    expect(slugla("İşler Kitabevleri")).toBe("isler-kitabevleri");
    expect(slugla("Sıfır Pozitif")).toBe("sifir-pozitif");
  });

  it("noktalama ve boşlukları tireye çevirir, baş/son tireyi atar", () => {
    expect(slugla("Özdebir TYT-AYT Denemesi 02")).toBe("ozdebir-tyt-ayt-denemesi-02");
    expect(slugla("  9-10-11. Sınıf  ")).toBe("9-10-11-sinif");
  });

  it("büyük İ ve ı ayrımını doğru yapar", () => {
    expect(slugla("IQ Gölge")).toBe("iq-golge");
    expect(slugla("İlyas Güneş")).toBe("ilyas-gunes");
  });
});
