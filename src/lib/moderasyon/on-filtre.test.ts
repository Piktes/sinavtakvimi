import { describe, expect, it } from "vitest";
import { kuralAciklamasi, normalize, onFiltre } from "@/lib/moderasyon/on-filtre";

const karar = (metin: string) => onFiltre(metin).karar;
const kurallar = (metin: string) => onFiltre(metin).tetiklenenKurallar;

describe("normalize", () => {
  it("Türkçe büyük harf katlamasını doğru yapar", () => {
    // "I".toLowerCase() İngilizce'de "i" verir; Türkçe'de "ı" olmalı.
    expect(normalize("SIKICI")).toContain("sıkıcı");
  });

  it("noktalama ve fazla boşluğu temizler", () => {
    expect(normalize("çok   iyi!!!  bir   deneme")).toBe("cok iyi bir deneme");
  });

  it("aksanları katlar — filtre atlatmayı zorlaştırır", () => {
    // "şiktir" / "sıktır" gibi varyantlar aynı köke inmeli.
    expect(normalize("ŞİKTİR")).toBe(normalize("siktir"));
    expect(normalize("GÖT")).toBe(normalize("got"));
  });
});

describe("temiz yorumlar", () => {
  it("sıradan bir yorumu geçirir", () => {
    expect(karar("Deneme gerçekten zordu, matematik kısmı çok uzundu.")).toBe("TEMIZ");
  });

  it("olumsuz ama küfürsüz eleştiriyi geçirir", () => {
    expect(karar("Sorular kötüydü, hiç beğenmedim. Baskı kalitesi de düşük.")).toBe("TEMIZ");
  });

  it("içinde rakam geçen normal yorumu geçirir", () => {
    expect(karar("TYT'de 35 net yaptım, ortalamanın üstü sanırım.")).toBe("TEMIZ");
  });

  it("küfür kökünü içeren MEŞRU kelimeyi yakalamaz", () => {
    // "malzeme" içinde "mal", "siklet" içinde "sik", "gotik" içinde "got".
    expect(karar("Kırtasiye malzemeleri ve siklet dengesi konusu vardı.")).toBe("TEMIZ");
  });
});

describe("kişisel veri → otomatik ret (§4.9)", () => {
  it("telefon numarasını reddeder", () => {
    expect(karar("Bana ulaş 0532 123 45 67")).toBe("RET");
    expect(kurallar("Bana ulaş 0532 123 45 67")).toContain("kisisel-veri:telefon");
  });

  it("boşluksuz telefon numarasını reddeder", () => {
    expect(karar("05321234567 ara")).toBe("RET");
  });

  it("+90'lı numarayı reddeder", () => {
    expect(karar("+90 532 123 45 67")).toBe("RET");
  });

  it("e-posta adresini reddeder", () => {
    expect(karar("cevaplar icin ogrenci@ornek.com yazın")).toBe("RET");
    expect(kurallar("ogrenci@ornek.com")).toContain("kisisel-veri:eposta");
  });

  it("sosyal medya kullanıcı adını reddeder", () => {
    expect(karar("takip et @ogrenci_2026")).toBe("RET");
  });

  it("instagram anahtar kelimesini reddeder", () => {
    expect(karar("instagram hesabımdan paylaşacağım")).toBe("RET");
    expect(karar("whatsapp grubuna ekleyeyim")).toBe("RET");
  });

  it("normal bir sayı dizisini telefon sanmaz", () => {
    expect(karar("2026 yılında 120 soru vardı")).toBe("TEMIZ");
  });
});

describe("küfür → otomatik ret", () => {
  it("açık küfrü reddeder", () => {
    expect(karar("bu deneme amk çok kötüydü")).toBe("RET");
  });

  it("kaçamak yazımı yakalar", () => {
    // Rakamla harf yerine geçirme denemesi.
    expect(karar("s1kt1r git")).toBe("RET");
  });

  it("büyük harfli küfrü yakalar", () => {
    expect(karar("SALAK BİR DENEME")).toBe("RET");
  });

  it("tetiklenen kuralı bildirir", () => {
    expect(kurallar("orospu")[0]).toContain("kufur:");
  });
});

describe("bağlantı → bayrak, ret değil (§4.9)", () => {
  it("http bağlantısını bayraklar ama reddetmez", () => {
    const sonuc = onFiltre("Cevap anahtarı burada https://ornek.com/cevap");
    expect(sonuc.karar).toBe("BAYRAK");
    expect(sonuc.tetiklenenKurallar).toContain("baglanti");
  });

  it("www ile başlayan adresi bayraklar", () => {
    expect(karar("www.ornek.com adresine bakın")).toBe("BAYRAK");
  });

  it("alan adı biçimini bayraklar", () => {
    expect(karar("ornek.com.tr sitesinde var")).toBe("BAYRAK");
  });
});

describe("skor", () => {
  it("temiz yorumda düşük skor verir", () => {
    expect(onFiltre("Gayet dengeli bir denemeydi, tavsiye ederim.").skor).toBeLessThan(0.5);
  });

  it("kişisel veri ve küfürde skor 1'dir", () => {
    expect(onFiltre("amk").skor).toBe(1);
    expect(onFiltre("0532 123 45 67").skor).toBe(1);
  });

  it("sinyaller birikince bayrağa geçer", () => {
    const sonuc = onFiltre("ÇOOOOOK KÖTÜÜÜÜ");
    expect(sonuc.tetiklenenKurallar).toContain("tekrar-karakter");
    expect(sonuc.skor).toBeGreaterThan(0);
  });

  it("skor 1'i aşmaz", () => {
    expect(onFiltre("BAKIN https://a.com ÇOOOOOK!!!!!").skor).toBeLessThanOrEqual(1);
  });

  it("boş metinde kural tetiklenmez", () => {
    expect(onFiltre("").tetiklenenKurallar).toEqual([]);
  });
});

describe("kuralAciklamasi", () => {
  it("küfür kuralını okunur hâle getirir", () => {
    expect(kuralAciklamasi("kufur:amk")).toBe("Küfür sözlüğü: amk");
  });

  it("kişisel veri kuralını Türkçeleştirir", () => {
    expect(kuralAciklamasi("kisisel-veri:telefon")).toBe("Kişisel veri: telefon numarası");
  });

  it("sabit kuralları çevirir", () => {
    expect(kuralAciklamasi("baglanti")).toBe("Bağlantı içeriyor");
  });

  it("bilinmeyen kuralı olduğu gibi döndürür", () => {
    expect(kuralAciklamasi("yeni-kural")).toBe("yeni-kural");
  });
});
