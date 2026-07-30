// §4.9: "Otomatik ön filtre: küfür sözlüğü, kişisel veri deseni
// (telefon/e-posta/Instagram adı → otomatik ret), bağlantı → bayrak,
// hız sınırı."
//
// Ön filtre KARAR VERİCİ DEĞİL, ön eleyicidir. "TEMIZ" bile olsa yorum
// BEKLIYOR olarak kaydedilir — §4.9 "admin onayından sonra yayınlanır"
// diyor, filtre bunu atlatmaz. Filtrenin işi moderatörün kuyruğunu
// sıralamak ve açık ihlalleri baştan reddetmek.
//
// Bağımlılıksız: hedef kitle reşit olmayan öğrenciler, kural kümesi küçük
// ve Türkçeye özgü. Hazır bir küfür paketi Türkçe çekim eklerini bilmiyor.

export type ModerasyonKarari = "TEMIZ" | "BAYRAK" | "RET";

export interface OnFiltreSonucu {
  karar: ModerasyonKarari;
  /** 0 (temiz) – 1 (kesin ret). Moderasyon kuyruğu buna göre sıralanır. */
  skor: number;
  /** Moderatöre "neden bayraklandı?" diye gösterilir (§6). */
  tetiklenenKurallar: string[];
}

// Türkçe büyük/küçük harf katlaması: "I".toLowerCase() İngilizce'de "i"
// verir, Türkçe'de "ı" olmalı.
//
// Aksanlar da KATLANIR (ç→c, ş→s, ğ→g, ö→o, ü→u). Bu bilinçli: filtre
// atlatmanın en kolay yolu aksanı değiştirmek ("sıktır" / "şiktir").
// Katlama yalnızca EŞLEŞTİRME için; kullanıcının yorumu olduğu gibi saklanır.
export function normalize(metin: string): string {
  return metin
    .toLocaleLowerCase("tr")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\p{L}\p{N}\s@._+-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Harf yerine rakam/simge koyarak filtreyi atlatma denemesi ("s1kt1r").
const KACAMAK_HARITASI: Record<string, string> = {
  "0": "o",
  "1": "i",
  "3": "e",
  "4": "a",
  "5": "s",
  "7": "t",
  "@": "a",
  $: "s",
};

function kacamaklariAc(metin: string): string {
  return metin.replace(/[013457@$]/g, (k) => KACAMAK_HARITASI[k] ?? k);
}

// Küfür kökleri. Çekim eki alabildikleri için kök eşleşmesi yapılıyor
// ("amk", "amına", "amcık" → hepsi "am" köküne değil, kendi köklerine).
// Liste kasten kısa: yanlış pozitif, kaçırmaktan daha maliyetli (öğrenci
// meşru yorumu reddedilirse bir daha yazmaz).
const KUFUR_KOKLERI = [
  "amk",
  "aq",
  "amina",
  "amcik",
  "orospu",
  "piç",
  "pic",
  "sik",
  "siktir",
  "yarrak",
  "gavat",
  "gerizekali",
  "salak",
  "aptal",
  "mal",
  "oc",
  "göt",
  "got",
  "bok",
  "kahpe",
  "ibne",
  "puşt",
  "pust",
];

// Tek başına anlamlı olabilecek kısa kökler yalnızca TAM KELİME eşleşmesinde
// sayılır: "mal" ("malzeme"de değil), "sik" ("siklet"te değil), "bok",
// "got" ("gotik"te değil), "oc".
const TAM_KELIME_GEREKTIRENLER = new Set(["mal", "sik", "bok", "got", "got", "oc", "pic"]);

// §4.9: kişisel veri deseni → OTOMATİK RET. Reşit olmayan kitlede iletişim
// bilgisi paylaşımı en yüksek riskli içerik; bayraklayıp beklemek bile
// bilginin bir süre görünür kalması demek olurdu (moderasyon öncesi
// görünmüyor ama yine de saklanmasını istemiyoruz — moderatöre de gitmesin
// diye değil, kuyruğa "RET" olarak düşsün diye).
const KISISEL_VERI_DESENLERI: { ad: string; desen: RegExp }[] = [
  // 05xx xxx xx xx / +90 5xx ... / 5xxxxxxxxx — boşluk ve ayraçlara tolerans.
  { ad: "telefon", desen: /(?:\+?90[\s.-]?)?0?5\d{2}[\s.-]?\d{3}[\s.-]?\d{2}[\s.-]?\d{2}/ },
  { ad: "eposta", desen: /[\p{L}\d._%+-]+@[\p{L}\d.-]+\.[\p{L}]{2,}/u },
  // @kullanici — Instagram/X kullanıcı adı. En az 3 karakter, e-postayla
  // karışmasın diye öncesinde harf/rakam olmamalı.
  { ad: "sosyal-medya", desen: /(?:^|[\s(])@[\p{L}\d._]{3,}/u },
  { ad: "instagram-anahtar", desen: /\b(?:insta|instagram|telegram|whatsapp|wp|dm)\b/ },
];

// §4.9: "bağlantı → bayrak" (ret değil).
const BAGLANTI_DESENI = /\b(?:https?:\/\/|www\.)\S+|\b[\p{L}\d-]+\.(?:com|net|org|tr|io|co)\b/u;

/** Aynı karakterin uzun tekrarı ("çoookkk", "!!!!!!") — spam sinyali. */
const TEKRAR_DESENI = /(.)\1{4,}/u;

/** Büyük harf oranı yüksek metin (bağırma). */
function buyukHarfOrani(metin: string): number {
  const harfler = [...metin].filter((k) => /\p{L}/u.test(k));
  if (harfler.length < 12) return 0;
  const buyukler = harfler.filter(
    (k) => k === k.toLocaleUpperCase("tr") && k !== k.toLocaleLowerCase("tr"),
  );
  return buyukler.length / harfler.length;
}

function kufurBulundu(normalize: string): string[] {
  const acik = kacamaklariAc(normalize);
  const kelimeler = new Set(acik.split(" "));
  const bulunanlar: string[] = [];

  for (const kok of KUFUR_KOKLERI) {
    const acikKok = kacamaklariAc(kok);
    const eslesti = TAM_KELIME_GEREKTIRENLER.has(kok)
      ? kelimeler.has(acikKok)
      : acik.includes(acikKok);
    if (eslesti) bulunanlar.push(kok);
  }

  return bulunanlar;
}

export function onFiltre(icerik: string): OnFiltreSonucu {
  const kurallar: string[] = [];
  let skor = 0;
  let ret = false;

  const ham = icerik.trim();
  const norm = normalize(ham);

  // Kişisel veri — otomatik ret (§4.9).
  for (const { ad, desen } of KISISEL_VERI_DESENLERI) {
    if (desen.test(ham) || desen.test(norm)) {
      kurallar.push(`kisisel-veri:${ad}`);
      ret = true;
    }
  }

  const kufurler = kufurBulundu(norm);
  if (kufurler.length > 0) {
    kurallar.push(`kufur:${kufurler.join(",")}`);
    ret = true;
  }

  // Bağlantı — bayrak, ret değil (§4.9). Yayınevinin kendi sayfasına
  // yönlendiren meşru bir bağlantı olabilir; moderatör karar versin.
  if (BAGLANTI_DESENI.test(ham)) {
    kurallar.push("baglanti");
    skor += 0.5;
  }

  if (TEKRAR_DESENI.test(ham)) {
    kurallar.push("tekrar-karakter");
    skor += 0.2;
  }

  if (buyukHarfOrani(ham) > 0.7) {
    kurallar.push("buyuk-harf");
    skor += 0.2;
  }

  // Çok kısa yorum bilgi taşımıyor ama yasak da değil — hafif sinyal.
  if (norm.length > 0 && norm.length < 8) {
    kurallar.push("cok-kisa");
    skor += 0.15;
  }

  if (ret) return { karar: "RET", skor: 1, tetiklenenKurallar: kurallar };

  const sinirliSkor = Math.min(skor, 0.99);
  return {
    karar: sinirliSkor >= 0.5 ? "BAYRAK" : "TEMIZ",
    skor: Number(sinirliSkor.toFixed(2)),
    tetiklenenKurallar: kurallar,
  };
}

/** Moderatör arayüzünde kural kodunu okunur metne çevirir. */
export function kuralAciklamasi(kural: string): string {
  if (kural.startsWith("kufur:")) return `Küfür sözlüğü: ${kural.slice(6)}`;
  if (kural.startsWith("kisisel-veri:")) {
    const tur = kural.slice(13);
    const adlar: Record<string, string> = {
      telefon: "telefon numarası",
      eposta: "e-posta adresi",
      "sosyal-medya": "sosyal medya kullanıcı adı",
      "instagram-anahtar": "sosyal medya anahtar kelimesi",
    };
    return `Kişisel veri: ${adlar[tur] ?? tur}`;
  }
  const sabitler: Record<string, string> = {
    baglanti: "Bağlantı içeriyor",
    "tekrar-karakter": "Tekrarlayan karakter",
    "buyuk-harf": "Çoğunlukla büyük harf",
    "cok-kisa": "Çok kısa",
  };
  return sabitler[kural] ?? kural;
}
