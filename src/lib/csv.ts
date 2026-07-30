// §4.2 içe aktarma için minimal CSV okuma/yazma. Yeni bağımlılık eklenmedi:
// ihtiyaç duyulan alt küme (tırnaklı alanlar, gömülü ayraç/satır sonu, çift
// tırnak kaçışı) yaklaşık 60 satır ve birim testleriyle kapsanabiliyor.
//
// Excel uyumu için iki ayrıntı kritik:
//   1. Türkçe Windows Excel varsayılan liste ayracı NOKTALI VİRGÜL (;) —
//      virgülle yazılan dosyayı tek sütuna sıkıştırır.
//   2. UTF-8 BOM olmadan Excel ç/ş/ğ/ı karakterlerini bozuk gösterir.
// Bu yüzden yazarken `;` + BOM kullanıyoruz, okurken ikisini de kabul ediyoruz.

export const CSV_AYRAC = ";";
export const UTF8_BOM = "﻿";

// Satır sonu ve ayraç içeren alanları tırnaklar; içteki tırnağı ikiler.
function alaniKacir(deger: string, ayrac: string): string {
  if (deger.includes('"') || deger.includes(ayrac) || /[\r\n]/.test(deger)) {
    return `"${deger.replaceAll('"', '""')}"`;
  }
  return deger;
}

export function csvYaz(basliklar: string[], satirlar: string[][], ayrac = CSV_AYRAC): string {
  const tumSatirlar = [basliklar, ...satirlar];
  return tumSatirlar
    .map((satir) => satir.map((hucre) => alaniKacir(hucre ?? "", ayrac)).join(ayrac))
    .join("\r\n");
}

// Dosyada hangi ayracın kullanıldığını ilk satıra bakarak tahmin eder.
// Tırnak içindeki ayraçlar sayılmaz.
export function ayraciTahminEt(metin: string): string {
  const ilkSatir = metin.split(/\r?\n/, 1)[0] ?? "";
  let tirnakIcinde = false;
  let noktaliVirgul = 0;
  let virgul = 0;

  for (const karakter of ilkSatir) {
    if (karakter === '"') tirnakIcinde = !tirnakIcinde;
    else if (!tirnakIcinde && karakter === ";") noktaliVirgul += 1;
    else if (!tirnakIcinde && karakter === ",") virgul += 1;
  }

  return virgul > noktaliVirgul ? "," : ";";
}

// RFC 4180 alt kümesi. Dönen dizinin her elemanı bir satır, her satır hücre
// dizisi. Tamamen boş satırlar atılır (dosya sonundaki fazladan satır sonu).
export function csvOku(metin: string, ayrac?: string): string[][] {
  const govde = metin.startsWith(UTF8_BOM) ? metin.slice(UTF8_BOM.length) : metin;
  const kullanilanAyrac = ayrac ?? ayraciTahminEt(govde);

  const satirlar: string[][] = [];
  let satir: string[] = [];
  let hucre = "";
  let tirnakIcinde = false;

  for (let i = 0; i < govde.length; i += 1) {
    const karakter = govde[i];

    if (tirnakIcinde) {
      if (karakter === '"') {
        // Çift tırnak = kaçırılmış tek tırnak.
        if (govde[i + 1] === '"') {
          hucre += '"';
          i += 1;
        } else {
          tirnakIcinde = false;
        }
      } else {
        hucre += karakter;
      }
      continue;
    }

    if (karakter === '"') {
      tirnakIcinde = true;
    } else if (karakter === kullanilanAyrac) {
      satir.push(hucre);
      hucre = "";
    } else if (karakter === "\n") {
      satir.push(hucre);
      satirlar.push(satir);
      satir = [];
      hucre = "";
    } else if (karakter === "\r") {
      // \r\n çiftinin \r'ı — yok sayılır.
    } else {
      hucre += karakter;
    }
  }

  // Dosya satır sonuyla bitmiyorsa son hücre/satır elde kalır.
  if (hucre !== "" || satir.length > 0) {
    satir.push(hucre);
    satirlar.push(satir);
  }

  return satirlar.filter((s) => s.some((h) => h.trim() !== ""));
}

// Başlık satırını okuyup her veri satırını { başlık: değer } nesnesine çevirir.
// Başlıklar kırpılır; eksik hücreler boş string olur.
export function csvNesneleriOku(metin: string): {
  basliklar: string[];
  satirlar: Record<string, string>[];
} {
  const hamSatirlar = csvOku(metin);
  if (hamSatirlar.length === 0) return { basliklar: [], satirlar: [] };

  const basliklar = hamSatirlar[0].map((baslik) => baslik.trim());

  const satirlar = hamSatirlar.slice(1).map((hucreler) => {
    const nesne: Record<string, string> = {};
    basliklar.forEach((baslik, index) => {
      nesne[baslik] = (hucreler[index] ?? "").trim();
    });
    return nesne;
  });

  return { basliklar, satirlar };
}
