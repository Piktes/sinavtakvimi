import { describe, expect, it } from "vitest";
import {
  anahtarla,
  satiriCoz,
  tarihCoz,
  tarihSaatCoz,
  type AramaTablolari,
} from "@/lib/ice-aktarma/ilan-satiri";

const tablolar: AramaTablolari = {
  kurumlar: new Map([
    ["özdebir", "k1"],
    ["işler kitabevleri", "k2"],
  ]),
  gruplar: new Map([["yks", "g1"]]),
  formatlar: new Map([["tyt-ayt", "f1"]]),
  duzeyler: new Map([
    ["12. sınıf", "d1"],
    ["lise mezunu", "d2"],
  ]),
};

const gecerliSatir = {
  baslik: "Özdebir TYT-AYT Denemesi 03",
  kurum: "Özdebir",
  grup: "YKS",
  format: "TYT-AYT",
  duzeyler: "12. Sınıf, Lise Mezunu",
  sinavTarihi: "30.10.2026",
  uygulamaTipi: "Türkiye Geneli",
};

describe("anahtarla", () => {
  it("Türkçe büyük harf katlamasını doğru yapar", () => {
    // "I".toLowerCase() İngilizce'de "i" verir; Türkçe'de "ı" olmalı.
    expect(anahtarla("IŞLER")).toBe("ışler");
    expect(anahtarla("İşler")).toBe("işler");
  });

  it("baş/son boşluğu ve fazla boşluğu temizler", () => {
    expect(anahtarla("  Bilgi   Sarmal ")).toBe("bilgi sarmal");
  });
});

describe("tarihCoz", () => {
  it("Türkçe Excel biçimini okur", () => {
    expect(tarihCoz("30.10.2026")).toBe("2026-10-30");
    expect(tarihCoz("1.9.2026")).toBe("2026-09-01");
  });

  it("ISO biçimini okur", () => {
    expect(tarihCoz("2026-10-30")).toBe("2026-10-30");
  });

  it("eğik çizgiyi kabul eder", () => {
    expect(tarihCoz("30/10/2026")).toBe("2026-10-30");
  });

  it("takvimde olmayan günü reddeder", () => {
    expect(tarihCoz("31.02.2026")).toBeNull();
    expect(tarihCoz("32.01.2026")).toBeNull();
  });

  it("anlamsız girdiyi reddeder", () => {
    expect(tarihCoz("yakında")).toBeNull();
    expect(tarihCoz("")).toBeNull();
  });
});

describe("tarihSaatCoz", () => {
  it("tarih ve saati birleştirir", () => {
    expect(tarihSaatCoz("01.11.2026 20:00")).toBe("2026-11-01T20:00");
  });

  it("saat yoksa gece yarısı varsayar", () => {
    expect(tarihSaatCoz("01.11.2026")).toBe("2026-11-01T00:00");
  });

  it("geçersiz saati reddeder", () => {
    expect(tarihSaatCoz("01.11.2026 25:00")).toBeNull();
  });
});

describe("satiriCoz", () => {
  it("geçerli satırı çözer", () => {
    const { veri, hatalar } = satiriCoz(gecerliSatir, 2, tablolar);
    expect(hatalar).toEqual([]);
    expect(veri).toMatchObject({
      kurumId: "k1",
      grupId: "g1",
      formatId: "f1",
      duzeyIds: ["d1", "d2"],
      sinavTarihi: "2026-10-30",
      uygulamaTipi: "TURKIYE_GENELI",
    });
  });

  it("sezonu sınav tarihinden türetir", () => {
    const { veri } = satiriCoz(gecerliSatir, 2, tablolar);
    expect(veri?.sezon).toBe("2026-2027");
  });

  it("kayıtlı olmayan kurumu satır ve sütunla bildirir", () => {
    const { hatalar } = satiriCoz({ ...gecerliSatir, kurum: "Bilinmeyen" }, 5, tablolar);
    expect(hatalar).toHaveLength(1);
    expect(hatalar[0]).toMatchObject({ satirNo: 5, sutun: "kurum", deger: "Bilinmeyen" });
    expect(hatalar[0].mesaj).toContain("panelde kayıtlı değil");
  });

  it("geçersiz zorluk için izinli değerleri söyler", () => {
    const { hatalar } = satiriCoz({ ...gecerliSatir, zorluk: "Çok Zor" }, 3, tablolar);
    expect(hatalar[0].mesaj).toContain("Kolay, Orta, Zor");
  });

  it("bitiş tarihi sınavdan önceyse reddeder", () => {
    const { hatalar } = satiriCoz({ ...gecerliSatir, sinavBitisTarihi: "29.10.2026" }, 4, tablolar);
    expect(hatalar[0].sutun).toBe("sinavBitisTarihi");
  });

  it("son sipariş sınavdan sonraysa reddeder", () => {
    const { hatalar } = satiriCoz({ ...gecerliSatir, sonSiparisTarihi: "31.10.2026" }, 4, tablolar);
    expect(hatalar[0].sutun).toBe("sonSiparisTarihi");
  });

  it("bir satırdaki tüm hataları birden toplar", () => {
    const { hatalar, veri } = satiriCoz(
      {
        baslik: "",
        kurum: "Yok",
        grup: "",
        format: "",
        duzeyler: "",
        sinavTarihi: "abc",
        uygulamaTipi: "",
      },
      7,
      tablolar,
    );
    expect(veri).toBeUndefined();
    // Kullanıcı tek tek denemek zorunda kalmasın diye hepsi aynı anda rapor edilir.
    expect(hatalar.length).toBeGreaterThanOrEqual(6);
    expect(hatalar.every((h) => h.satirNo === 7)).toBe(true);
  });

  it("düzeyleri virgülle ayırıp eşler, tanımadığını bildirir", () => {
    const { hatalar } = satiriCoz(
      { ...gecerliSatir, duzeyler: "12. Sınıf, Uzay Mühendisi" },
      2,
      tablolar,
    );
    expect(hatalar).toHaveLength(1);
    expect(hatalar[0].mesaj).toContain("Uzay Mühendisi");
  });
});
