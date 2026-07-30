import { describe, expect, it } from "vitest";
import { googleTakvimBaglantisi, icsUret, ilanUid, zamanDamgasi } from "@/lib/ics";

const gun = (iso: string) => new Date(`${iso}T00:00:00.000Z`);
const SIMDI = new Date("2026-03-01T09:30:00.000Z");

function satirlar(ics: string): string[] {
  // Katlanmış satırları geri birleştir — testler mantığı sınamalı, biçimi değil.
  return ics.replace(/\r\n /g, "").split("\r\n").filter(Boolean);
}

function alan(ics: string, ad: string): string | undefined {
  return satirlar(ics)
    .find((satir) => satir.startsWith(`${ad}:`) || satir.startsWith(`${ad};`))
    ?.split(":")
    .slice(1)
    .join(":");
}

describe("icsUret", () => {
  const temel = {
    uid: ilanUid("abc"),
    baslik: "Deneme Sınavı",
    baslangic: gun("2026-04-12"),
  };

  it("geçerli bir VCALENDAR iskeleti üretir", () => {
    const ics = icsUret([temel], { takvimAdi: "Test", simdi: SIMDI });
    const s = satirlar(ics);
    expect(s[0]).toBe("BEGIN:VCALENDAR");
    expect(s.at(-1)).toBe("END:VCALENDAR");
    expect(s).toContain("VERSION:2.0");
    expect(ics.endsWith("\r\n")).toBe(true);
  });

  it("tüm satırları CRLF ile ayırır", () => {
    const ics = icsUret([temel], { takvimAdi: "Test", simdi: SIMDI });
    // Tek başına \n kalmamalı.
    expect(ics.replace(/\r\n/g, "")).not.toContain("\n");
  });

  it("tek günlük olayda DTEND ertesi gündür (DTEND dışlayıcı)", () => {
    const ics = icsUret([temel], { takvimAdi: "Test", simdi: SIMDI });
    expect(satirlar(ics)).toContain("DTSTART;VALUE=DATE:20260412");
    expect(satirlar(ics)).toContain("DTEND;VALUE=DATE:20260413");
  });

  it("çok günlük olayda son gün DTEND'e dahildir", () => {
    const ics = icsUret([{ ...temel, bitis: gun("2026-04-14") }], {
      takvimAdi: "Test",
      simdi: SIMDI,
    });
    expect(satirlar(ics)).toContain("DTSTART;VALUE=DATE:20260412");
    expect(satirlar(ics)).toContain("DTEND;VALUE=DATE:20260415");
  });

  it("ay ve yıl sınırını doğru aşar", () => {
    const ics = icsUret([{ ...temel, baslangic: gun("2026-12-31") }], {
      takvimAdi: "Test",
      simdi: SIMDI,
    });
    expect(satirlar(ics)).toContain("DTEND;VALUE=DATE:20270101");
  });

  it("noktalı virgül, virgül, ters bölü ve satır sonunu kaçışlar", () => {
    const ics = icsUret([{ ...temel, baslik: "A;B,C\\D", aciklama: "birinci\nikinci" }], {
      takvimAdi: "Test",
      simdi: SIMDI,
    });
    expect(alan(ics, "SUMMARY")).toBe("A\\;B\\,C\\\\D");
    expect(alan(ics, "DESCRIPTION")).toBe("birinci\\nikinci");
  });

  it("ters bölüyü iki kez kaçışlamaz", () => {
    const ics = icsUret([{ ...temel, baslik: "yol\\yeni" }], {
      takvimAdi: "Test",
      simdi: SIMDI,
    });
    expect(alan(ics, "SUMMARY")).toBe("yol\\\\yeni");
  });

  it("uzun satırları 75 oktetten kısa parçalara katlar", () => {
    const uzun = "Türkçe ğüşiöç karakterli çok uzun bir sınav başlığı ".repeat(4);
    const ics = icsUret([{ ...temel, baslik: uzun }], { takvimAdi: "Test", simdi: SIMDI });

    for (const satir of ics.split("\r\n")) {
      expect(Buffer.from(satir, "utf8").length).toBeLessThanOrEqual(75);
    }
  });

  it("katlanan satır çözüldüğünde özgün metni verir", () => {
    const uzun = "Türkçe ğüşiöç karakterli çok uzun bir sınav başlığı ".repeat(4).trim();
    const ics = icsUret([{ ...temel, baslik: uzun }], { takvimAdi: "Test", simdi: SIMDI });
    expect(alan(ics, "SUMMARY")).toBe(uzun);
  });

  it("aynı ilan için UID değişmez", () => {
    const bir = icsUret([temel], { takvimAdi: "Test", simdi: SIMDI });
    const iki = icsUret([{ ...temel, baslik: "Değişti", sira: 3 }], {
      takvimAdi: "Test",
      simdi: new Date("2026-06-01T00:00:00.000Z"),
    });
    expect(alan(bir, "UID")).toBe(alan(iki, "UID"));
    expect(satirlar(iki)).toContain("SEQUENCE:3");
  });

  it("birden çok olayı tek takvimde toplar", () => {
    const ics = icsUret([temel, { ...temel, uid: ilanUid("def"), baslangic: gun("2026-05-01") }], {
      takvimAdi: "Koleksiyon",
      simdi: SIMDI,
    });
    expect(satirlar(ics).filter((s) => s === "BEGIN:VEVENT")).toHaveLength(2);
  });

  it("boş listede geçerli ama olaysız takvim üretir", () => {
    const ics = icsUret([], { takvimAdi: "Boş", simdi: SIMDI });
    expect(satirlar(ics)).not.toContain("BEGIN:VEVENT");
    expect(satirlar(ics).at(-1)).toBe("END:VCALENDAR");
  });

  it("takvim adındaki özel karakterleri kaçışlar", () => {
    const ics = icsUret([], { takvimAdi: "Sınav; İlan", simdi: SIMDI });
    expect(alan(ics, "X-WR-CALNAME")).toBe("Sınav\\; İlan");
  });
});

describe("zamanDamgasi", () => {
  it("UTC damgası üretir", () => {
    expect(zamanDamgasi(new Date("2026-03-01T09:30:05.000Z"))).toBe("20260301T093005Z");
  });
});

describe("googleTakvimBaglantisi", () => {
  it("tüm-gün aralığı dışlayıcı bitişle kodlar", () => {
    const url = new URL(googleTakvimBaglantisi({ baslik: "Deneme", baslangic: gun("2026-04-12") }));
    expect(url.searchParams.get("dates")).toBe("20260412/20260413");
    expect(url.searchParams.get("action")).toBe("TEMPLATE");
    expect(url.searchParams.get("ctz")).toBe("Europe/Istanbul");
  });

  it("başlıktaki Türkçe karakterleri kodlar", () => {
    const url = new URL(
      googleTakvimBaglantisi({ baslik: "Türkiye Geneli Deneme", baslangic: gun("2026-04-12") }),
    );
    expect(url.searchParams.get("text")).toBe("Türkiye Geneli Deneme");
  });

  it("açıklama ve bağlantıyı details alanında birleştirir", () => {
    const url = new URL(
      googleTakvimBaglantisi({
        baslik: "Deneme",
        baslangic: gun("2026-04-12"),
        aciklama: "Yayınevi: X",
        url: "https://ornek.test/ilan/x",
      }),
    );
    expect(url.searchParams.get("details")).toBe("Yayınevi: X\n\nhttps://ornek.test/ilan/x");
  });

  it("ayrıntı yoksa details parametresi eklenmez", () => {
    const url = new URL(googleTakvimBaglantisi({ baslik: "Deneme", baslangic: gun("2026-04-12") }));
    expect(url.searchParams.has("details")).toBe(false);
  });
});
