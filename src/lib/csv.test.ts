import { describe, expect, it } from "vitest";
import { ayraciTahminEt, csvNesneleriOku, csvOku, csvYaz, UTF8_BOM } from "@/lib/csv";

describe("csvOku", () => {
  it("basit satırları ayrıştırır", () => {
    expect(csvOku("a;b;c\r\n1;2;3")).toEqual([
      ["a", "b", "c"],
      ["1", "2", "3"],
    ]);
  });

  it("tırnaklı alandaki ayracı bölmez", () => {
    expect(csvOku('ad;aciklama\r\n"Özdebir";"TYT; AYT birlikte"')).toEqual([
      ["ad", "aciklama"],
      ["Özdebir", "TYT; AYT birlikte"],
    ]);
  });

  it("tırnak içindeki satır sonunu korur", () => {
    expect(csvOku('a;b\r\n"iki\nsatır";x')).toEqual([
      ["a", "b"],
      ["iki\nsatır", "x"],
    ]);
  });

  it("çift tırnağı tek tırnağa indirger", () => {
    expect(csvOku('a\r\n"12"" ekran"')).toEqual([["a"], ['12" ekran']]);
  });

  it("UTF-8 BOM'u yok sayar (Excel'in yazdığı dosya)", () => {
    expect(csvOku(`${UTF8_BOM}ad;sehir\r\nAli;Ankara`)).toEqual([
      ["ad", "sehir"],
      ["Ali", "Ankara"],
    ]);
  });

  it("tamamen boş satırları atar", () => {
    expect(csvOku("a;b\r\n1;2\r\n\r\n")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  it("dosya satır sonuyla bitmese de son satırı okur", () => {
    expect(csvOku("a;b\r\n1;2")).toHaveLength(2);
  });
});

describe("ayraciTahminEt", () => {
  it("Türkçe Excel'in noktalı virgülünü tanır", () => {
    expect(ayraciTahminEt("ad;tarih;zorluk")).toBe(";");
  });

  it("virgülle yazılmış dosyayı tanır", () => {
    expect(ayraciTahminEt("ad,tarih,zorluk")).toBe(",");
  });

  it("tırnak içindeki virgülü ayraç sanmaz", () => {
    expect(ayraciTahminEt('ad;"Ankara, Türkiye";zorluk')).toBe(";");
  });
});

describe("csvYaz", () => {
  it("ayraç içeren alanı tırnaklar", () => {
    expect(csvYaz(["ad", "not"], [["Özdebir", "TYT; AYT"]])).toBe(
      'ad;not\r\nÖzdebir;"TYT; AYT"',
    );
  });

  it("içteki tırnağı ikiler", () => {
    expect(csvYaz(["a"], [['12" ekran']])).toBe('a\r\n"12"" ekran"');
  });

  it("yazdığını geri okuyabilir (gidiş-dönüş)", () => {
    const basliklar = ["ad", "aciklama"];
    const satirlar = [["Özdebir", 'A;B "C"']];
    expect(csvOku(csvYaz(basliklar, satirlar))).toEqual([basliklar, ...satirlar]);
  });
});

describe("csvNesneleriOku", () => {
  it("başlıkları anahtar yapar ve boşlukları kırpar", () => {
    const { basliklar, satirlar } = csvNesneleriOku(" ad ; tarih \r\nÖzdebir ; 2026-10-30 ");
    expect(basliklar).toEqual(["ad", "tarih"]);
    expect(satirlar).toEqual([{ ad: "Özdebir", tarih: "2026-10-30" }]);
  });

  it("eksik hücreyi boş string yapar", () => {
    const { satirlar } = csvNesneleriOku("a;b;c\r\n1;2");
    expect(satirlar[0]).toEqual({ a: "1", b: "2", c: "" });
  });

  it("boş dosyada boş sonuç döner", () => {
    expect(csvNesneleriOku("")).toEqual({ basliklar: [], satirlar: [] });
  });
});
