import { describe, expect, it } from "vitest";
import {
  formatKisa,
  formatTarih,
  formatTarihAralik,
  formatTarihSaat,
  gunAnahtari,
  kalanGun,
  kalanGunSayisi,
} from "@/lib/tarih";

// @db.Date sütunları Prisma'dan UTC gece yarısı olarak gelir.
const gun = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

describe("formatTarih", () => {
  it("Türkçe ay adıyla biçimlendirir", () => {
    expect(formatTarih(gun("2026-10-30"))).toBe("30 Ekim 2026");
  });
});

describe("formatTarihAralik", () => {
  it("bitiş yoksa tek tarih verir", () => {
    expect(formatTarihAralik(gun("2026-10-30"), null)).toBe("30 Ekim 2026");
  });

  it("ay değişiyorsa iki ayı da yazar", () => {
    expect(formatTarihAralik(gun("2026-10-30"), gun("2026-11-01"))).toBe("30 Ekim – 1 Kasım 2026");
  });

  it("aynı ay içindeyse ayı tekrarlamaz", () => {
    expect(formatTarihAralik(gun("2026-10-09"), gun("2026-10-12"))).toBe("9–12 Ekim 2026");
  });

  it("başlangıç ve bitiş aynı günse tek tarih verir", () => {
    expect(formatTarihAralik(gun("2026-10-09"), gun("2026-10-09"))).toBe("9 Ekim 2026");
  });
});

describe("formatTarihSaat", () => {
  it("UTC anını Europe/Istanbul saatiyle gösterir", () => {
    // 17:00 UTC = 20:00 İstanbul (UTC+3, DST yok).
    expect(formatTarihSaat(new Date("2026-11-01T17:00:00.000Z"))).toBe("1 Kasım 2026, 20:00");
  });

  it("gece yarısını geçen UTC anında günü doğru kaydırır", () => {
    // 21:30 UTC 13 Haziran = 00:30 İstanbul 14 Haziran.
    expect(formatTarihSaat(new Date("2026-06-13T21:30:00.000Z"))).toBe("14 Haziran 2026, 00:30");
  });
});

describe("formatKisa", () => {
  it("kısa ay adı verir", () => {
    expect(formatKisa(gun("2026-10-30"))).toBe("30 Eki");
  });
});

describe("gunAnahtari", () => {
  it("İstanbul takvim gününü verir", () => {
    expect(gunAnahtari(new Date("2026-06-13T21:30:00.000Z"))).toBe("2026-06-14");
  });
});

describe("kalanGun", () => {
  const simdi = new Date("2026-10-07T09:00:00.000Z");

  it("bugünü tanır", () => {
    expect(kalanGun(gun("2026-10-07"), simdi)).toBe("Bugün");
  });

  it("yarını tanır", () => {
    expect(kalanGun(gun("2026-10-08"), simdi)).toBe("Yarın");
  });

  it("ileri tarih için kalan günü sayar", () => {
    expect(kalanGun(gun("2026-10-30"), simdi)).toBe("23 gün kaldı");
  });

  it("geçmiş tarihi geriye doğru sayar", () => {
    expect(kalanGun(gun("2026-10-01"), simdi)).toBe("6 gün önce");
  });
});

describe("kalanGunSayisi", () => {
  it("kayan şerit eşiği için gün farkı verir", () => {
    const simdi = new Date("2026-10-07T09:00:00.000Z");
    expect(kalanGunSayisi(gun("2026-10-14"), simdi)).toBe(7);
    expect(kalanGunSayisi(gun("2026-10-06"), simdi)).toBe(-1);
  });
});
