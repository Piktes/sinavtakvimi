import { describe, expect, it } from "vitest";
import {
  GONDERIM_SAATI,
  SACILMA_DK,
  gonderimAnahtari,
  gonderimAni,
  gunEkle,
  hedefGunler,
  istanbulGunu,
} from "@/lib/bildirim/zamanlama";

describe("istanbulGunu", () => {
  it("UTC gününü İstanbul gününe çevirir", () => {
    expect(istanbulGunu(new Date("2026-04-12T10:00:00.000Z"))).toBe("2026-04-12");
  });

  it("gece yarısından önceki UTC anı ertesi İstanbul günüdür", () => {
    // UTC 22:00 = İstanbul 01:00 (ertesi gün)
    expect(istanbulGunu(new Date("2026-04-12T22:00:00.000Z"))).toBe("2026-04-13");
  });

  it("İstanbul gece yarısının hemen öncesi hâlâ aynı gündür", () => {
    // UTC 20:59 = İstanbul 23:59
    expect(istanbulGunu(new Date("2026-04-12T20:59:00.000Z"))).toBe("2026-04-12");
  });
});

describe("gunEkle", () => {
  it("ay sınırını aşar", () => {
    expect(gunEkle("2026-01-30", 3)).toBe("2026-02-02");
  });

  it("yıl sınırını aşar", () => {
    expect(gunEkle("2026-12-30", 3)).toBe("2027-01-02");
  });

  it("artık yılı bilir", () => {
    expect(gunEkle("2028-02-28", 1)).toBe("2028-02-29");
  });

  it("sıfır gün eklerse aynı günü verir", () => {
    expect(gunEkle("2026-04-12", 0)).toBe("2026-04-12");
  });
});

describe("gonderimAni", () => {
  const anahtar = gonderimAnahtari("abn1", "iln1", 3);

  it("İstanbul saatiyle 08:00 civarına düşer", () => {
    const an = gonderimAni("2026-04-12", anahtar);
    const istanbulSaati = new Date(an.getTime() + 3 * 60 * 60_000);
    expect(istanbulSaati.getUTCHours()).toBeGreaterThanOrEqual(GONDERIM_SAATI - 1);
    expect(istanbulSaati.getUTCHours()).toBeLessThanOrEqual(GONDERIM_SAATI);
  });

  it("saçılma ±15 dakikayı aşmaz", () => {
    // İstanbul 08:00 = UTC 05:00
    const merkez = new Date("2026-04-12T05:00:00.000Z").getTime();
    for (let i = 0; i < 500; i += 1) {
      const an = gonderimAni("2026-04-12", gonderimAnahtari(`a${i}`, `i${i}`, i % 8));
      const farkDk = Math.abs(an.getTime() - merkez) / 60_000;
      expect(farkDk).toBeLessThanOrEqual(SACILMA_DK);
    }
  });

  it("AYNI anahtar için AYNI anı verir — yeniden planlama kaydırmaz", () => {
    const bir = gonderimAni("2026-04-12", anahtar);
    const iki = gonderimAni("2026-04-12", anahtar);
    expect(bir.getTime()).toBe(iki.getTime());
  });

  it("farklı anahtarlar zamana yayılır", () => {
    const anlar = new Set(
      Array.from({ length: 200 }, (_, i) =>
        gonderimAni("2026-04-12", gonderimAnahtari(`abn${i}`, "iln", 3)).getTime(),
      ),
    );
    // 31 olası dakika var; 200 anahtarın hepsi tek dakikaya düşmemeli.
    expect(anlar.size).toBeGreaterThan(10);
  });

  it("gün değişince an da değişir", () => {
    const bir = gonderimAni("2026-04-12", anahtar);
    const iki = gonderimAni("2026-04-13", anahtar);
    expect(iki.getTime() - bir.getTime()).toBe(24 * 60 * 60_000);
  });
});

describe("hedefGunler", () => {
  it("ofseti sınav gününe çevirir", () => {
    expect(hedefGunler("2026-04-12", [3, 1])).toEqual([
      { ofset: 3, gun: "2026-04-15" },
      { ofset: 1, gun: "2026-04-13" },
    ]);
  });

  it("sıfır ofset bugünü verir (sınav günü sabahı)", () => {
    expect(hedefGunler("2026-04-12", [0])).toEqual([{ ofset: 0, gun: "2026-04-12" }]);
  });

  it("yinelenen ofsetleri teker", () => {
    expect(hedefGunler("2026-04-12", [3, 3, 1])).toHaveLength(2);
  });

  it("boş ofset listesinde boş döner", () => {
    expect(hedefGunler("2026-04-12", [])).toEqual([]);
  });
});
