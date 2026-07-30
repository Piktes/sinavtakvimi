// §4.2 içe aktarma: şablonun sütun tanımı. Hem indirilebilir örnek dosya
// hem doğrulama raporu bu tek listeden üretilir — başlık değişince ikisi
// birden değişir, ikisi ayrı yerde tanımlanıp birbirinden kopmaz.

export interface SutunTanimi {
  anahtar: string;
  zorunlu: boolean;
  aciklama: string;
  ornek: string;
  // İzinli değerler sabitse burada; kurum/etiket gibi DB'den gelenler
  // çalışma anında doldurulur.
  izinliDegerler?: string[];
}

export const ILAN_SUTUNLARI: SutunTanimi[] = [
  {
    anahtar: "baslik",
    zorunlu: true,
    aciklama: "İlanın tam adı",
    ornek: "Özdebir TYT-AYT Denemesi 03",
  },
  {
    anahtar: "kurum",
    zorunlu: true,
    aciklama: "Sınavı yapan kurum. Panelde kayıtlı olmalı",
    ornek: "Özdebir",
  },
  {
    anahtar: "grup",
    zorunlu: true,
    aciklama: "Sınav ailesi (Etiketler > Gruplar)",
    ornek: "YKS",
  },
  {
    anahtar: "format",
    zorunlu: true,
    aciklama: "İçerik tipi (Etiketler > Formatlar)",
    ornek: "TYT-AYT",
  },
  {
    anahtar: "duzeyler",
    zorunlu: true,
    aciklama: "Hedef düzeyler. Birden fazlaysa virgülle ayırın",
    ornek: "12. Sınıf, Lise Mezunu",
  },
  {
    anahtar: "sinavTarihi",
    zorunlu: true,
    aciklama: "GG.AA.YYYY veya YYYY-AA-GG",
    ornek: "30.10.2026",
  },
  {
    anahtar: "uygulamaTipi",
    zorunlu: true,
    aciklama: "Uygulama biçimi",
    ornek: "Türkiye Geneli",
    izinliDegerler: ["Türkiye Geneli", "Kurumsal"],
  },
  {
    anahtar: "sinavBitisTarihi",
    zorunlu: false,
    aciklama: "Aralıklı sınavlarda son gün. Sınav tarihinden sonra olmalı",
    ornek: "01.11.2026",
  },
  {
    anahtar: "saat",
    zorunlu: false,
    aciklama: "SS:DD biçiminde",
    ornek: "09:45",
  },
  {
    anahtar: "sonSiparisTarihi",
    zorunlu: false,
    aciklama: "Sınav tarihinden sonra olamaz",
    ornek: "14.10.2026",
  },
  {
    anahtar: "cevapAnahtariZamani",
    zorunlu: false,
    aciklama: "Tarih ve saat: GG.AA.YYYY SS:DD",
    ornek: "01.11.2026 20:00",
  },
  {
    anahtar: "zorluk",
    zorunlu: false,
    aciklama: "Boş bırakılabilir",
    ornek: "Orta",
    izinliDegerler: ["Kolay", "Orta", "Zor"],
  },
  {
    anahtar: "dagiticiKurum",
    zorunlu: false,
    aciklama: "Dağıtımı yapan kurum (farklıysa)",
    ornek: "İşler Kitabevleri",
  },
  {
    anahtar: "seriNo",
    zorunlu: false,
    aciklama: "Seri içindeki sıra numarası",
    ornek: "3",
  },
  {
    anahtar: "sezon",
    zorunlu: false,
    aciklama: "Boş bırakılırsa sınav tarihinden hesaplanır",
    ornek: "2026-2027",
  },
  {
    anahtar: "detayUrl",
    zorunlu: false,
    aciklama: "Yayınevinin sayfası",
    ornek: "https://ornek.com/deneme",
  },
  {
    anahtar: "aciklama",
    zorunlu: false,
    aciklama: "Serbest not",
    ornek: "",
  },
];

export const ZORUNLU_SUTUNLAR = ILAN_SUTUNLARI.filter((s) => s.zorunlu).map((s) => s.anahtar);
