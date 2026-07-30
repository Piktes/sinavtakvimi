import { describe, expect, it } from "vitest";
import { kullaniciAnahtari, tekillestir, type GonderimAdayi } from "@/lib/bildirim/tekillestir";

const aday = (seviye: GonderimAdayi["seviye"], ek: Partial<GonderimAdayi> = {}): GonderimAdayi => ({
  kullaniciId: "k1",
  abonelikId: `abn-${seviye}`,
  seviye,
  ilanId: "iln1",
  ofset: 3,
  ...ek,
});

describe("tekillestir", () => {
  it("aynı üçlüde ilan aboneliği koleksiyonu yener", () => {
    const sonuc = tekillestir([aday("koleksiyon"), aday("ilan")]);
    expect(sonuc).toHaveLength(1);
    expect(sonuc[0].seviye).toBe("ilan");
  });

  it("kurum aboneliği koleksiyonu yener", () => {
    const sonuc = tekillestir([aday("koleksiyon"), aday("kurum")]);
    expect(sonuc[0].seviye).toBe("kurum");
  });

  it("üç seviye birdeyse ilan kazanır", () => {
    const sonuc = tekillestir([aday("kurum"), aday("koleksiyon"), aday("ilan")]);
    expect(sonuc).toHaveLength(1);
    expect(sonuc[0].abonelikId).toBe("abn-ilan");
  });

  it("giriş sırası sonucu değiştirmez", () => {
    const ileri = tekillestir([aday("ilan"), aday("kurum")]);
    const geri = tekillestir([aday("kurum"), aday("ilan")]);
    expect(ileri[0].abonelikId).toBe(geri[0].abonelikId);
  });

  it("farklı kullanıcıları birleştirmez", () => {
    const sonuc = tekillestir([aday("koleksiyon"), aday("koleksiyon", { kullaniciId: "k2" })]);
    expect(sonuc).toHaveLength(2);
  });

  it("farklı ofsetleri birleştirmez", () => {
    const sonuc = tekillestir([aday("koleksiyon"), aday("koleksiyon", { ofset: 1 })]);
    expect(sonuc).toHaveLength(2);
  });

  it("farklı ilanları birleştirmez", () => {
    const sonuc = tekillestir([aday("koleksiyon"), aday("koleksiyon", { ilanId: "iln2" })]);
    expect(sonuc).toHaveLength(2);
  });

  it("boş listede boş döner", () => {
    expect(tekillestir([])).toEqual([]);
  });
});

describe("kullaniciAnahtari", () => {
  it("üç bileşeni de ayırt eder", () => {
    expect(kullaniciAnahtari("k1", "i1", 3)).not.toBe(kullaniciAnahtari("k1", "i1", 1));
    expect(kullaniciAnahtari("k1", "i1", 3)).not.toBe(kullaniciAnahtari("k2", "i1", 3));
    expect(kullaniciAnahtari("k1", "i1", 3)).not.toBe(kullaniciAnahtari("k1", "i2", 3));
  });
});
