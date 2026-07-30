import { describe, expect, it } from "vitest";
import {
  BOS_AKTIF_FILTRE,
  aktifFiltreSayisi,
  filtreyiUrleYaz,
  ilanlariFiltrele,
  ilanlariSirala,
  urldenFiltreOku,
} from "@/components/takvim/filtre-mantigi";
import type { IlanOzet } from "@/lib/veri/ilan";

function ilan(parcali: Partial<IlanOzet> & { id: string }): IlanOzet {
  return {
    baslik: "Deneme",
    slug: parcali.id,
    seriNo: null,
    sinavTarihi: "2026-10-10",
    sinavBitisTarihi: null,
    saat: null,
    sonSiparisTarihi: null,
    cevapAnahtariZamani: null,
    uygulamaTipi: "TURKIYE_GENELI",
    zorluk: "ORTA",
    oneCikar: false,
    puanOrtalama: null,
    puanSayisi: 0,
    kurum: { id: "k1", ad: "Özdebir", slug: "ozdebir", logoUrl: null },
    dagiticiKurum: null,
    grup: { id: "g1", ad: "YKS", slug: "yks" },
    format: { id: "f1", ad: "TYT", slug: "tyt" },
    duzeyler: [{ id: "d1", ad: "12. Sınıf", slug: "12-sinif" }],
    ...parcali,
  };
}

const ornekler = [
  ilan({ id: "a" }),
  ilan({
    id: "b",
    kurum: { id: "k2", ad: "Paraf", slug: "paraf", logoUrl: null },
    format: { id: "f2", ad: "AYT", slug: "ayt" },
    zorluk: "ZOR",
    uygulamaTipi: "KURUMSAL",
    duzeyler: [{ id: "d2", ad: "11. Sınıf", slug: "11-sinif" }],
    sinavTarihi: "2026-10-05",
  }),
];

describe("ilanlariFiltrele", () => {
  it("boş filtre her şeyi geçirir", () => {
    expect(ilanlariFiltrele(ornekler, BOS_AKTIF_FILTRE)).toHaveLength(2);
  });

  it("yayınevine göre süzer", () => {
    const sonuc = ilanlariFiltrele(ornekler, { ...BOS_AKTIF_FILTRE, kurumlar: ["paraf"] });
    expect(sonuc.map((i) => i.id)).toEqual(["b"]);
  });

  it("facetler arası VE uygular", () => {
    const sonuc = ilanlariFiltrele(ornekler, {
      ...BOS_AKTIF_FILTRE,
      kurumlar: ["paraf"],
      formatlar: ["tyt"],
    });
    expect(sonuc).toHaveLength(0);
  });

  it("aynı facet içinde VEYA uygular", () => {
    const sonuc = ilanlariFiltrele(ornekler, {
      ...BOS_AKTIF_FILTRE,
      formatlar: ["tyt", "ayt"],
    });
    expect(sonuc).toHaveLength(2);
  });

  it("düzeyde kesişim arar (ilan birden çok düzeye bağlı olabilir)", () => {
    const sonuc = ilanlariFiltrele(ornekler, { ...BOS_AKTIF_FILTRE, duzeyler: ["11-sinif"] });
    expect(sonuc.map((i) => i.id)).toEqual(["b"]);
  });

  it("zorluğu boş olan ilan, zorluk filtresi varken elenir", () => {
    const zorluksuz = [ilan({ id: "c", zorluk: null })];
    expect(ilanlariFiltrele(zorluksuz, { ...BOS_AKTIF_FILTRE, zorluklar: ["ORTA"] })).toHaveLength(
      0,
    );
  });
});

describe("ilanlariSirala", () => {
  it("varsayılan tarihe göre artan", () => {
    expect(ilanlariSirala(ornekler, "tarih").map((i) => i.id)).toEqual(["b", "a"]);
  });

  it("yayınevine göre Türkçe sıralar", () => {
    expect(ilanlariSirala(ornekler, "yayinevi").map((i) => i.kurum.ad)).toEqual([
      "Özdebir",
      "Paraf",
    ]);
  });
});

describe("URL durumu", () => {
  it("filtreyi URL'e yazıp geri okur (gidiş-dönüş)", () => {
    const filtre = {
      kurumlar: ["ozdebir", "paraf"],
      formatlar: ["tyt-ayt"],
      duzeyler: [],
      zorluklar: ["ZOR"],
      uygulamaTipleri: [],
    };
    const params = filtreyiUrleYaz(filtre, "yayinevi");
    expect(params.get("yayinevi")).toBe("ozdebir,paraf");
    expect(params.get("sirala")).toBe("yayinevi");
    expect(urldenFiltreOku(params)).toEqual(filtre);
  });

  it("boş filtrede URL'e hiçbir şey yazmaz", () => {
    expect(filtreyiUrleYaz(BOS_AKTIF_FILTRE, "tarih").toString()).toBe("");
  });
});

describe("aktifFiltreSayisi", () => {
  it("tüm facetlerdeki seçimleri toplar", () => {
    expect(
      aktifFiltreSayisi({
        kurumlar: ["a", "b"],
        formatlar: ["c"],
        duzeyler: [],
        zorluklar: ["ZOR"],
        uygulamaTipleri: [],
      }),
    ).toBe(4);
  });
});
