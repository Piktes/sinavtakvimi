import type { IlanOzet } from "@/lib/veri/ilan";

// §4.3: filtreler İSTEMCİDE uygulanır — "tuşa basınca sonuç anında değişir,
// iskelet ekranı yanıp sönmez". Bu modül saf fonksiyon: hem filtre çubuğu
// hem birim testleri aynı mantığı kullanır.
export interface AktifFiltre {
  kurumlar: string[];
  formatlar: string[];
  duzeyler: string[];
  zorluklar: string[];
  uygulamaTipleri: string[];
  iller: string[];
}

export const BOS_AKTIF_FILTRE: AktifFiltre = {
  kurumlar: [],
  formatlar: [],
  duzeyler: [],
  zorluklar: [],
  uygulamaTipleri: [],
  iller: [],
};

export type Siralama = "tarih" | "yayinevi";

// Her facet kendi içinde VEYA, facetler arası VE — filtre çubuğunun
// beklenen davranışı (bir yayınevi + bir format seçince ikisini de sağlayan).
export function ilanlariFiltrele(ilanlar: IlanOzet[], filtre: AktifFiltre): IlanOzet[] {
  return ilanlar.filter((ilan) => {
    if (filtre.kurumlar.length && !filtre.kurumlar.includes(ilan.kurum.slug)) return false;
    if (filtre.formatlar.length && !filtre.formatlar.includes(ilan.format.slug)) return false;
    if (filtre.zorluklar.length && (!ilan.zorluk || !filtre.zorluklar.includes(ilan.zorluk))) {
      return false;
    }
    if (filtre.uygulamaTipleri.length && !filtre.uygulamaTipleri.includes(ilan.uygulamaTipi)) {
      return false;
    }
    if (filtre.iller.length && (!ilan.il || !filtre.iller.includes(ilan.il))) return false;
    if (
      filtre.duzeyler.length &&
      !ilan.duzeyler.some((duzey) => filtre.duzeyler.includes(duzey.slug))
    ) {
      return false;
    }
    return true;
  });
}

export function ilanlariSirala(ilanlar: IlanOzet[], siralama: Siralama): IlanOzet[] {
  const kopya = [...ilanlar];
  if (siralama === "yayinevi") {
    // Türkçe sıralama: DB'deki ICU collation'ın istemci karşılığı.
    return kopya.sort(
      (a, b) =>
        a.kurum.ad.localeCompare(b.kurum.ad, "tr") || a.sinavTarihi.localeCompare(b.sinavTarihi),
    );
  }
  return kopya.sort(
    (a, b) => a.sinavTarihi.localeCompare(b.sinavTarihi) || a.baslik.localeCompare(b.baslik, "tr"),
  );
}

export function aktifFiltreSayisi(filtre: AktifFiltre): number {
  return (
    filtre.kurumlar.length +
    filtre.formatlar.length +
    filtre.duzeyler.length +
    filtre.zorluklar.length +
    filtre.uygulamaTipleri.length +
    filtre.iller.length
  );
}

// §4.3: filtre durumu URL'e yazılır — paylaşılabilir, geri tuşu çalışır,
// SEO'ya hizmet eder.
export function filtreyiUrleYaz(filtre: AktifFiltre, siralama: Siralama): URLSearchParams {
  const params = new URLSearchParams();
  if (filtre.kurumlar.length) params.set("yayinevi", filtre.kurumlar.join(","));
  if (filtre.formatlar.length) params.set("format", filtre.formatlar.join(","));
  if (filtre.duzeyler.length) params.set("duzey", filtre.duzeyler.join(","));
  if (filtre.zorluklar.length) params.set("zorluk", filtre.zorluklar.join(","));
  if (filtre.uygulamaTipleri.length) params.set("uygulama", filtre.uygulamaTipleri.join(","));
  if (filtre.iller.length) params.set("il", filtre.iller.join(","));
  if (siralama !== "tarih") params.set("sirala", siralama);
  return params;
}

export function urldenFiltreOku(params: URLSearchParams): AktifFiltre {
  const coz = (anahtar: string) => {
    const ham = params.get(anahtar);
    return ham ? ham.split(",").filter(Boolean) : [];
  };

  return {
    kurumlar: coz("yayinevi"),
    formatlar: coz("format"),
    duzeyler: coz("duzey"),
    zorluklar: coz("zorluk"),
    uygulamaTipleri: coz("uygulama"),
    iller: coz("il"),
  };
}
