// §4.2: "doğrulama raporu — kaç geçerli, hangileri hatalı ve neden."
// Bu modül SAF: DB'ye dokunmaz, kendisine verilen arama tablolarıyla çalışır.
// Böylece birim testiyle kapsanabiliyor.

import { sezonTuret } from "@/lib/sezon";

export interface SatirHatasi {
  satirNo: number;
  sutun: string;
  deger: string;
  mesaj: string;
}

export interface CozulmusSatir {
  satirNo: number;
  baslik: string;
  kurumId: string;
  dagiticiKurumId: string | null;
  grupId: string;
  formatId: string;
  duzeyIds: string[];
  sinavTarihi: string;
  sinavBitisTarihi: string | null;
  saat: string | null;
  sonSiparisTarihi: string | null;
  cevapAnahtariZamani: string | null;
  uygulamaTipi: "TURKIYE_GENELI" | "KURUMSAL";
  zorluk: "KOLAY" | "ORTA" | "ZOR" | null;
  seriNo: number | null;
  sezon: string;
  detayUrl: string | null;
  aciklama: string | null;
}

// Ad → id eşlemesi. Karşılaştırma Türkçe'ye duyarlı biçimde normalize edilir
// ("özdebir" ile "Özdebir" aynı sayılır).
export type AramaTablosu = Map<string, string>;

export interface AramaTablolari {
  kurumlar: AramaTablosu;
  gruplar: AramaTablosu;
  formatlar: AramaTablosu;
  duzeyler: AramaTablosu;
}

// Türkçe büyük/küçük harf tuzağı: "I".toLowerCase() → "i" değil "ı" olmalı.
// `tr` yerelini vererek doğru katlama yapıyoruz.
export function anahtarla(metin: string): string {
  return metin.trim().toLocaleLowerCase("tr").replace(/\s+/g, " ");
}

const UYGULAMA_ESLEME: Record<string, "TURKIYE_GENELI" | "KURUMSAL"> = {
  "türkiye geneli": "TURKIYE_GENELI",
  "turkiye geneli": "TURKIYE_GENELI",
  turkiye_geneli: "TURKIYE_GENELI",
  kurumsal: "KURUMSAL",
};

const ZORLUK_ESLEME: Record<string, "KOLAY" | "ORTA" | "ZOR"> = {
  kolay: "KOLAY",
  orta: "ORTA",
  zor: "ZOR",
};

// GG.AA.YYYY (Excel'in Türkçe yerelde yazdığı biçim), GG/AA/YYYY ve
// YYYY-AA-GG kabul edilir. Dönen değer daima YYYY-AA-GG.
export function tarihCoz(ham: string): string | null {
  const metin = ham.trim();
  if (!metin) return null;

  let yil: number;
  let ay: number;
  let gun: number;

  const noktali = /^(\d{1,2})[.\/](\d{1,2})[.\/](\d{4})$/.exec(metin);
  const isoBenzeri = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(metin);

  if (noktali) {
    gun = Number(noktali[1]);
    ay = Number(noktali[2]);
    yil = Number(noktali[3]);
  } else if (isoBenzeri) {
    yil = Number(isoBenzeri[1]);
    ay = Number(isoBenzeri[2]);
    gun = Number(isoBenzeri[3]);
  } else {
    return null;
  }

  // Takvimde gerçekten var mı? (32.01, 31.02 gibi girdileri yakalar)
  const tarih = new Date(Date.UTC(yil, ay - 1, gun));
  if (
    tarih.getUTCFullYear() !== yil ||
    tarih.getUTCMonth() !== ay - 1 ||
    tarih.getUTCDate() !== gun
  ) {
    return null;
  }

  return `${yil}-${String(ay).padStart(2, "0")}-${String(gun).padStart(2, "0")}`;
}

// "GG.AA.YYYY SS:DD" → "YYYY-AA-GGTSS:DD"
export function tarihSaatCoz(ham: string): string | null {
  const metin = ham.trim();
  if (!metin) return null;

  const parcalar = metin.split(/[\sT]+/);
  const tarih = tarihCoz(parcalar[0] ?? "");
  if (!tarih) return null;

  const saat = parcalar[1] ?? "00:00";
  if (!/^\d{1,2}:\d{2}$/.test(saat)) return null;

  const [ss, dd] = saat.split(":").map(Number);
  if (ss > 23 || dd > 59) return null;

  return `${tarih}T${String(ss).padStart(2, "0")}:${String(dd).padStart(2, "0")}`;
}

export function satiriCoz(
  satir: Record<string, string>,
  satirNo: number,
  tablolar: AramaTablolari,
): { veri?: CozulmusSatir; hatalar: SatirHatasi[] } {
  const hatalar: SatirHatasi[] = [];
  const hata = (sutun: string, mesaj: string) =>
    hatalar.push({ satirNo, sutun, deger: satir[sutun] ?? "", mesaj });

  const al = (sutun: string) => (satir[sutun] ?? "").trim();

  const baslik = al("baslik");
  if (!baslik) hata("baslik", "Zorunlu alan boş.");
  else if (baslik.length < 3) hata("baslik", "En az 3 karakter olmalı.");

  // --- Kurum / etiket eşleşmeleri ---
  const kurumAdi = al("kurum");
  const kurumId = tablolar.kurumlar.get(anahtarla(kurumAdi));
  if (!kurumAdi) hata("kurum", "Zorunlu alan boş.");
  else if (!kurumId) hata("kurum", `"${kurumAdi}" panelde kayıtlı değil. Önce Kurumlar'a ekleyin.`);

  const dagiticiAdi = al("dagiticiKurum");
  let dagiticiKurumId: string | null = null;
  if (dagiticiAdi) {
    const bulunan = tablolar.kurumlar.get(anahtarla(dagiticiAdi));
    if (!bulunan) hata("dagiticiKurum", `"${dagiticiAdi}" panelde kayıtlı değil.`);
    else dagiticiKurumId = bulunan;
  }

  const grupAdi = al("grup");
  const grupId = tablolar.gruplar.get(anahtarla(grupAdi));
  if (!grupAdi) hata("grup", "Zorunlu alan boş.");
  else if (!grupId) hata("grup", `"${grupAdi}" bir grup etiketi değil.`);

  const formatAdi = al("format");
  const formatId = tablolar.formatlar.get(anahtarla(formatAdi));
  if (!formatAdi) hata("format", "Zorunlu alan boş.");
  else if (!formatId) hata("format", `"${formatAdi}" bir format etiketi değil.`);

  const duzeyHam = al("duzeyler");
  const duzeyIds: string[] = [];
  if (!duzeyHam) {
    hata("duzeyler", "Zorunlu alan boş. En az bir düzey yazın.");
  } else {
    for (const parca of duzeyHam.split(",")) {
      const ad = parca.trim();
      if (!ad) continue;
      const bulunan = tablolar.duzeyler.get(anahtarla(ad));
      if (!bulunan) hata("duzeyler", `"${ad}" bir düzey etiketi değil.`);
      else duzeyIds.push(bulunan);
    }
    if (duzeyIds.length === 0 && duzeyHam) {
      // Hepsi eşleşmediyse yukarıda zaten hata var.
    }
  }

  // --- Tarihler ---
  const sinavHam = al("sinavTarihi");
  const sinavTarihi = tarihCoz(sinavHam);
  if (!sinavHam) hata("sinavTarihi", "Zorunlu alan boş.");
  else if (!sinavTarihi) {
    hata("sinavTarihi", `"${sinavHam}" bir tarih değil. Örnek: 30.10.2026`);
  }

  const bitisHam = al("sinavBitisTarihi");
  let sinavBitisTarihi: string | null = null;
  if (bitisHam) {
    const cozulen = tarihCoz(bitisHam);
    if (!cozulen) hata("sinavBitisTarihi", `"${bitisHam}" bir tarih değil. Örnek: 01.11.2026`);
    else if (sinavTarihi && cozulen <= sinavTarihi) {
      hata("sinavBitisTarihi", "Bitiş tarihi, sınav tarihinden sonra olmalı.");
    } else sinavBitisTarihi = cozulen;
  }

  const siparisHam = al("sonSiparisTarihi");
  let sonSiparisTarihi: string | null = null;
  if (siparisHam) {
    const cozulen = tarihCoz(siparisHam);
    if (!cozulen) hata("sonSiparisTarihi", `"${siparisHam}" bir tarih değil.`);
    else if (sinavTarihi && cozulen > sinavTarihi) {
      hata("sonSiparisTarihi", "Son sipariş tarihi, sınav tarihinden sonra olamaz.");
    } else sonSiparisTarihi = cozulen;
  }

  const cevapHam = al("cevapAnahtariZamani");
  let cevapAnahtariZamani: string | null = null;
  if (cevapHam) {
    const cozulen = tarihSaatCoz(cevapHam);
    if (!cozulen) {
      hata("cevapAnahtariZamani", `"${cevapHam}" anlaşılamadı. Örnek: 01.11.2026 20:00`);
    } else cevapAnahtariZamani = cozulen;
  }

  const saatHam = al("saat");
  let saat: string | null = null;
  if (saatHam) {
    if (!/^\d{1,2}:\d{2}$/.test(saatHam)) {
      hata("saat", `"${saatHam}" saat değil. Örnek: 09:45`);
    } else {
      const [ss, dd] = saatHam.split(":").map(Number);
      if (ss > 23 || dd > 59) hata("saat", `"${saatHam}" geçerli bir saat değil.`);
      else saat = `${String(ss).padStart(2, "0")}:${String(dd).padStart(2, "0")}`;
    }
  }

  // --- Sabit değerli alanlar ---
  const uygulamaHam = al("uygulamaTipi");
  const uygulamaTipi = UYGULAMA_ESLEME[anahtarla(uygulamaHam)];
  if (!uygulamaHam) hata("uygulamaTipi", "Zorunlu alan boş.");
  else if (!uygulamaTipi) {
    hata("uygulamaTipi", `"${uygulamaHam}" geçersiz. İzinli: Türkiye Geneli, Kurumsal`);
  }

  const zorlukHam = al("zorluk");
  let zorluk: "KOLAY" | "ORTA" | "ZOR" | null = null;
  if (zorlukHam) {
    const cozulen = ZORLUK_ESLEME[anahtarla(zorlukHam)];
    if (!cozulen) hata("zorluk", `"${zorlukHam}" geçersiz. İzinli: Kolay, Orta, Zor`);
    else zorluk = cozulen;
  }

  const seriHam = al("seriNo");
  let seriNo: number | null = null;
  if (seriHam) {
    const sayi = Number(seriHam);
    if (!Number.isInteger(sayi) || sayi < 1) {
      hata("seriNo", `"${seriHam}" pozitif tam sayı olmalı.`);
    } else seriNo = sayi;
  }

  const detayUrl = al("detayUrl");
  if (detayUrl && !/^https?:\/\//i.test(detayUrl)) {
    hata("detayUrl", "http:// veya https:// ile başlamalı.");
  }

  if (hatalar.length > 0) return { hatalar };

  const cozulmusSinavTarihi = sinavTarihi!;

  return {
    hatalar: [],
    veri: {
      satirNo,
      baslik,
      kurumId: kurumId!,
      dagiticiKurumId,
      grupId: grupId!,
      formatId: formatId!,
      duzeyIds,
      sinavTarihi: cozulmusSinavTarihi,
      sinavBitisTarihi,
      saat,
      sonSiparisTarihi,
      cevapAnahtariZamani,
      uygulamaTipi: uygulamaTipi!,
      zorluk,
      seriNo,
      sezon: al("sezon") || sezonTuret(new Date(`${cozulmusSinavTarihi}T00:00:00.000Z`)),
      detayUrl: detayUrl || null,
      aciklama: al("aciklama") || null,
    },
  };
}
