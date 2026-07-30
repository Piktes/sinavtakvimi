# SINAV İLAN PLATFORMU — SIFIRDAN YAPIM ŞARTNAMESİ

> Bu doküman bir AI kodlama ajanına (Claude Code, Cursor) doğrudan verilebilir.
> Önceki şartnameleri geçersiz kılar. Kararlar gerekçelidir; gerekçeye katılmıyorsan
> kod yazmadan önce sor.

---

## 0. Ürün tek cümlede

**Yayınevleri ve eğitim kurumlarının deneme sınavı ilanlarını yayınladığı, öğrencilerin bu ilanları takvim üzerinde takip ettiği, bildirim aldığı ve yorumladığı bir platform.**

Bir **ilan panosudur.** Admin ilan girer, önizler, yayınlar. Kullanıcı görür, filtreler, bildirim alır, yorum yapar. Bundan fazlası değil.

**Ne DEĞİL:** Resmî sınav süreç takipçisi değil. Başvuru penceresi, giriş belgesi, tercih dönemi, sınav merkezi ataması gibi kavramlar bu ürüne ait değildir ve modellenmeyecektir.

### Gerçek veri örnekleri (ilanın neye benzediği)

```
Özdebir TYT-AYT Denemesi 02        Türkiye Geneli · Orta
30 Ekim – 1 Kasım 2026
Son sipariş: 14 Ekim 2026
Cevap anahtarı ve video çözümler: 1 Kasım 2026, 20:00
Oturumlar: TYT 09:45 · 165 dk · 120 soru | AYT 14:30 · 180 dk · 160 soru
```

```
CZM 9-10-11. Sınıf Gelişim İzleme Sınavı 1        Kurumsal · Orta
6–9 Kasım 2026
Son sipariş: 23 Ekim 2026
Cevap anahtarı: 9 Kasım 2026 Pazartesi, 20:00
Kurum: Çözüm Eğitim Kurumları
```

```
Mikro Orijinal TYT Denemesi        Türkiye Geneli · Zor
9–12 Ekim 2026
Dağıtım: İşler Kitabevleri
```

Ölçek: **sezonda 800–1200 ilan**, 45+ yayınevi. Bu sayı, filtrelemeyi ürünün merkezine koyar.

---

## 1. Teknoloji

| Katman     | Seçim                                                       |
| ---------- | ----------------------------------------------------------- |
| Framework  | Next.js 15 App Router + TypeScript                          |
| Stil       | Tailwind CSS v4 + CSS değişken katmanı                      |
| Bileşen    | shadcn/ui                                                   |
| Animasyon  | Motion (framer-motion)                                      |
| İkon       | Lucide React — **tek ikon ailesi, başkası kullanılmayacak** |
| Veritabanı | PostgreSQL 16 + Prisma                                      |
| Kimlik     | Auth.js v5, database session                                |
| Kuyruk     | pg-boss (Redis yok — Windows'ta gereksiz bağımlılık)        |
| E-posta    | Nodemailer + React Email                                    |
| Doğrulama  | Zod, uçtan uca paylaşımlı                                   |

Geliştirme Windows, yayın Ubuntu VPS. Dosya adları küçük harf-tire, import yolları birebir (Linux harf duyarlı). Yollar `path.join()`. `.gitattributes` ile LF.

---

## 2. Veri modeli

**Tasarım kuralı: 10 tablo. Bu sayıyı aşan bir öneri varsa gerekçesini sor.**

```
Kurum
  id, ad, slug @unique, tipId → KurumTipi, logoUrl, kapakUrl,
  webSitesi, aciklamaMd, sira, aktifMi

KurumTipi                    ← admin yeni tip ekleyebilir, enum DEĞİL
  id, ad, slug @unique, sira, aktifMi
  seed: Yayınevi, Dershane/Kurs, Kitabevi/Dağıtıcı, Birlik/Dernek,
        Bakanlık, Üniversite/Kurum

Etiket                       ← TEK taksonomi tablosu, tip ile ayrılır
  id, tip (GRUP|DUZEY|FORMAT), ad, slug, kisaAd, sira, aktifMi
  @@unique([tip, slug])
  GRUP   : YKS, LGS, 11. Sınıf, 10. Sınıf, 9. Sınıf, 8. Sınıf, 7. Sınıf,
           6. Sınıf, 5. Sınıf, 4. Sınıf, KPSS, TUS, DUS, YDS, Bursluluk
  DUZEY  : 4–12. Sınıf, Lise Mezunu, Lisans Mezunu, Tıp Mezunu,
           Diş Hekimliği Mezunu, Öğretmen Adayı
  FORMAT : TYT, AYT, TYT-AYT, MSÜ, LGS, Branş, Karma, Gelişim İzleme,
           Seviye Belirleme, Bursluluk, Kazanım

Ilan                         ← ürünün kalbi
  id, baslik, slug @unique, seriNo?,
  kurumId → Kurum, dagiticiKurumId? → Kurum,
  grupId → Etiket, formatId → Etiket, duzeyler[] → Etiket (çoka-çok),
  sinavTarihi (date), sinavBitisTarihi? (date), saat? (text "09:45"),
  sonSiparisTarihi? (date),
  cevapAnahtariZamani? (timestamptz),
  uygulamaTipi (TURKIYE_GENELI | KURUMSAL),
  zorluk? (KOLAY | ORTA | ZOR),
  aciklamaMd?, afisUrl?, detayUrl?,
  sezon (text, otomatik türetilir), oneCikar (bool),
  yayinDurumu (TASLAK | YAYINDA | ARSIV),
  puanOrtalama? (denormalize), puanSayisi (int),
  olusturan, olusturulma, guncellenme

Oturum                       ← opsiyonel, çoğu ilanda boş
  id, ilanId, ad, saat?, sureDk?, soruSayisi?, sira

Koleksiyon                   ← üst menü = kayıtlı filtreler
  id, ad, slug @unique, sira, aktifMi, ikon?,
  varsayilanGorunum (AYLIK|LISTE|HAFTALIK),
  filtre (jsonb — Zod şemasıyla tiplenmiş, serbest bırakılmayacak),
  menudeMi, anaSayfadaMi

TakvimNotu
  id, ad, baslangic, bitis, tip (TATIL|BAYRAM|SINAV_YOK|TAHMINI), aciklama?, aktifMi

Kullanici
  id, eposta @unique, sifreHash, takmaAd @unique,
  epostaDogrulandi, yasBeyani13Ustu, duzeyId? → Etiket,
  temaTercihi, rol (KULLANICI|MODERATOR|EDITOR|ADMIN),
  durum, olusturulma, sonGiris

Abonelik                     ← bildirim; üç hedeften TAM BİRİ dolu (CHECK)
  id, kullaniciId, ilanId?, kurumId?, koleksiyonId?,
  ofsetler (int[] gün), aktifMi
  @@unique kombinasyon başına

Yorum
  id, ilanId, kullaniciId?, puan? (1-5), icerik,
  durum (BEKLIYOR|ONAYLANDI|REDDEDILDI|SPAM),
  moderatorId?, moderasyonNotu?, olusturulma

Ayar                         ← her şey admin panelden
  anahtar @unique, deger (jsonb), grup

DenetimKaydi
  id, adminId, eylem, varlik, varlikId, oncesi?, sonrasi?, zaman
```

**Kurallar:**

- Tüm zamanlar DB'de UTC, arayüzde Europe/Istanbul (UTC+3 sabit). Tek dönüştürme modülü.
- `sinavBitisTarihi` doluysa `sinavTarihi`'nden büyük — Zod + DB CHECK.
- `sezon` boşsa `sinavTarihi`'nden türetilir (kesme noktası 1 Ağustos): 30.10.2026 → "2026-2027".
- `Etiket.ad` alanında Türkçe ICU collation: `CREATE COLLATION turkish (provider = icu, locale = 'tr-TR')`. Aynısı `Kurum.ad`, `Ilan.baslik` için.
- `Yorum.kullaniciId` nullable + `onDelete: SetNull` — hesap silinince yorum anonimleşir.
- Index: `Ilan(yayinDurumu, sinavTarihi)`, `Ilan(sezon, sinavTarihi)`, `Ilan(kurumId)`, `Ilan(grupId)`, `Ilan(formatId)`, `Yorum(durum, olusturulma)`, `Koleksiyon(aktifMi, sira)`.

---

## 3. GÖRSEL SİSTEM — tutarlılık zorunlulukları

> **Bu bölüm ürünün en katı bölümüdür. Buradaki kurallar öneri değil, kısıttır.
> Tutarsız görünen bir arayüz, eksik bir özellikten daha çok zarar verir.**

### 3.1 Tek kaynak kuralı

Hiçbir görsel değer bileşen içinde yazılmayacak. Renk, boşluk, yarıçap, gölge, tipografi — hepsi CSS değişkeninden okunur.

**Yasak, istisnasız:**

- Bileşen içinde hex kodu: `#2563EB`, `rgb(...)`, `hsl(...)`
- Tailwind serbest değer: `p-[13px]`, `text-[15px]`, `w-[347px]`, `bg-[#fff]`
- Satır içi `style={{ color: ... }}`
- Ölçekte olmayan boşluk veya font boyutu

**Doğrulama, her commit öncesi çalıştırılacak:**

```bash
grep -rEn "#[0-9a-fA-F]{3,8}\b" src/ --include=*.tsx --include=*.ts | grep -v "tokens/"
grep -rEn "\[[0-9]+px\]|\[#" src/ --include=*.tsx
```

İkisi de boş dönmeli. `styles/tokens/` dışında hex bulunması hatadır.

### 3.2 Boşluk — 4px tabanlı, 8 basamak

```
--space-1: 4px    --space-2: 8px    --space-3: 12px   --space-4: 16px
--space-5: 24px   --space-6: 32px   --space-7: 48px   --space-8: 64px
```

Ara değer yok. 20px gerekiyorsa 16 veya 24 seçilir.

### 3.3 Tipografi — 7 basamak, ölçek dışına çıkılmaz

```
--text-xs:   12px / 1.4    etiket, rozet
--text-sm:   14px / 1.5    yardımcı metin, meta
--text-base: 16px / 1.6    gövde
--text-lg:   18px / 1.5    kart başlığı
--text-xl:   24px / 1.3    bölüm başlığı
--text-2xl:  32px / 1.2    sayfa başlığı
--text-3xl:  48px / 1.1    kahraman
```

Ağırlık yalnızca 400, 500, 600, 700. 300 ve 800 kullanılmayacak.

**Sayısal içerik** (tarih, geri sayım, süre, soru sayısı) daima monospace ve `font-variant-numeric: tabular-nums` — geri sayım titrememesi için işlevsel zorunluluk.

### 3.4 Yarıçap ve gölge — üçer tane, fazlası yok

```
--radius-sm: 6px     --radius-md: 12px    --radius-lg: 20px
--shadow-sm  --shadow-md  --shadow-lg
```

### 3.5 Renk — anlamsal isimlerle

Ham renk adı kullanılmaz; rol adı kullanılır.

```
--bg  --bg-subtle  --surface  --surface-hover  --border  --border-strong
--text  --text-muted  --text-faint
--primary  --primary-hover  --primary-fg
--accent  --accent-fg
--success  --warning  --danger   (+ her biri için -bg varyantı)
--focus-ring
```

Açık ve koyu tema aynı değişken adlarını farklı değerlerle doldurur. Bileşen hangi temada olduğunu **bilmez**. `dark:` öneki bileşenlerde kullanılmayacak — yalnızca token dosyasında.

**Kontrast:** metin/zemin en az 4.5:1, büyük metin 3:1. Her iki temada doğrulanacak.

### 3.6 Yayınevi rozet rengi — otomatik, elle seçilmez

45+ yayınevi var. Admin her biri için renk seçmeyecek. Renk `slug`'dan deterministik üretilir:

```ts
// slug → sabit ton. Aynı yayınevi her yerde aynı renk.
function kurumTonu(slug: string): number {
  let h = 0;
  for (const c of slug) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
}
// Kullanım: hsl(var(--kurum-h) 65% 45%) — doygunluk ve açıklık SABİT,
// yalnızca ton değişir. Böylece 45 renk birbiriyle uyumlu kalır.
```

Doygunluk/açıklık sabitlenmesi kritik: rastgele HSL üçlüsü kullanılırsa palet dağılır.

### 3.7 Tek bileşen kuralı

Aynı işi yapan iki bileşen bulunmayacak. Uygulamada **tek** `Card`, **tek** `Badge`, **tek** `Button`, **tek** `Select`, **tek** `EmptyState`, **tek** `Skeleton` vardır. Varyasyon prop ile yapılır, kopya bileşenle değil.

**Tarih biçimlendirme tek fonksiyondan geçer.** Hiçbir bileşende `toLocaleDateString` çağrılmayacak:

```ts
formatTarih(d)                  → "30 Ekim 2026"
formatTarihAralik(a, b)         → "30 Ekim – 1 Kasım 2026"
formatTarihSaat(d)              → "1 Kasım 2026, 20:00"
formatKisa(d)                   → "30 Eki"
kalanGun(d)                     → "23 gün kaldı" | "Yarın" | "Bugün"
```

**İkonlar:** yalnızca Lucide, `strokeWidth={1.75}`, boyut yalnızca 16/20/24.

**Odak halkası** her etkileşimli öğede aynı: `outline: 2px solid var(--focus-ring); outline-offset: 2px`.

### 3.8 Hareket — tek eğri, üç süre

```
--ease: cubic-bezier(0.32, 0.72, 0, 1)
--dur-fast: 120ms    --dur-base: 200ms    --dur-slow: 400ms
```

`prefers-reduced-motion: reduce` altında tüm süreler 0'a iner — tek yerde, global CSS'te.

### 3.9 Tutarlılık kontrol listesi (commit öncesi)

- [ ] `styles/tokens/` dışında hex yok
- [ ] Serbest Tailwind değeri yok
- [ ] Bileşenlerde `dark:` yok
- [ ] Ölçek dışı boşluk/font yok
- [ ] Tarihler yalnızca `formatTarih*` üzerinden
- [ ] Tek Card/Badge/Button/Select/Skeleton/EmptyState
- [ ] Tüm ikonlar Lucide, strokeWidth 1.75
- [ ] Sayısal alanlar tabular-nums
- [ ] Her yeni ekranda boş durum ve yükleme durumu tasarlanmış
- [ ] Kontrast her iki temada geçiyor

---

## 4. Genel site — etkileşim

### 4.1 Temel problem

Sezonda 1000+ ilan. Kullanıcı **bu ay kendisini ilgilendiren 4 ilanı 10 saniyede** görmeli. Filtreleme bir özellik değil, ürünün kendisi.

### 4.2 Kalıcı düzey seçimi — en önemli tek karar

İlk ziyarette, giriş gerektirmeden, tek adım:

```
        Hangi düzeydesin?
  [12] [11] [10] [9] [8] [7] [6] [5] [4]
  [Mezun] [KPSS] [TUS] [DUS] [YDS]
              Sonra seçerim →
```

Çereze yazılır, tüm sayfalarda varsayılan filtre olur, üst bardan tek tıkla değişir (`11. Sınıf ▾`). Giriş yapmışsa hesaba kaydedilir. "Sonra seçerim" diyen her şeyi görür — engelleyici değil.

**Bu olmadan her kullanıcı 1000 kayıtlık bir duvara bakar.**

### 4.3 Filtreleme — anında, sunucuya gitmeden

- Aktif ay/aralığın ilanları sunucudan bir kez gelir; filtreler **istemcide** uygulanır → tuşa basınca sonuç anında değişir, iskelet ekranı yanıp sönmez
- Filtre durumu `useOptimistic` + `router.replace` ile URL'e yazılır — paylaşılabilir, geri tuşu çalışır, SEO'ya hizmet eder
- Ay değiştiğinde sunucudan yeni veri, `Suspense` ile akış halinde

**Filtre çubuğu:**

```
Görünüm: [Aylık] Liste Haftalık        Sırala: [Tarih] Yayınevi
Yayınevi ▾  Format ▾  Zorluk ▾  T.Geneli/Kurumsal ▾
Aktif: (Özdebir ×) (TYT-AYT ×)                          Temizle
```

- Yayınevi seçici: arama kutusu + logo ızgarası, çoklu seçim. 45 kurum için metin listesi kullanılmaz — öğrenci markayı logodan tanır.
- Aktif filtreler rozet olarak görünür, tek tıkla kalkar.
- Kaydırınca filtre çubuğu yapışır ve tek satıra iner.

### 4.4 Görünümler

| Görünüm          | Varsayılan | Davranış                                                                                                                                                                   |
| ---------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Aylık ızgara** | Masaüstü   | Gün hücrelerinde ilan rozetleri (yayınevi tonunda). Hücre üzerine gelince hover kartı: başlık, saat, zorluk. Ok tuşlarıyla gezinilebilir, Enter açar. Tatiller gri bantla. |
| **Liste**        | **Mobil**  | Tarih başlıklarıyla gruplu kart akışı. Cumartesi hücresine 6 ilan sığmadığı için mobilde ızgara kullanılmaz.                                                               |
| **Haftalık**     | —          | Bu hafta + gelecek hafta, saat detaylı                                                                                                                                     |

Görünüm geçişleri View Transitions API ile; desteklenmeyen tarayıcıda anında geçiş.

### 4.5 Modern etkileşim gereksinimleri

- **Komut paleti (Cmd/Ctrl+K):** ilan, yayınevi, koleksiyon araması. Klavye ile tam gezinme.
- **Kayan şerit:** 7 gün içindeki ilanlar. CSS `transform` ile, `marquee` etiketi veya `setInterval` yok. Üzerine gelince durur. Gösterilecek ilan yoksa tamamen gizlenir.
- **Geri sayım:** en yakın ilana kalan süre, monospace, sunucu zaman damgasından. `aria-live` **kullanılmaz** — sabit metin: "Özdebir denemesine 23 gün".
- **Mobilde filtre:** alt sayfa (bottom sheet), sürükleyerek kapanır.
- **Optimistik davranış:** bildirim aç/kapat anında görünür, sunucu hatasında geri alınır + toast.
- **İskelet ekranlar** gerçek düzenin şeklinde — genel gri blok değil.
- **Boş durumlar tasarlanmış:** "Bu filtrelerde ilan yok" + en yakın ilanı öner + filtreyi temizle butonu.
- **Tema geçişi sıçramasız:** tema çerezden okunur ve SSR'da `<html>` üzerine yazılır.
- Sonsuz kaydırma yok — sayfalama veya ay bazlı gezinme. Takvimde sonsuz kaydırma yön kaybettirir.

### 4.6 Sayfalar

```
/                      ana sayfa (blokları admin yönetir)
/takvim                takvim, filtreli, URL durumlu
/takvim/[yil]/[ay]     derin bağlantı
/ilan/[slug]           ilan detayı
/yayinevi/[slug]       kurumun tüm ilanları + logo + tanıtım
/k/[slug]              koleksiyon (üst menü sekmesi)
/ara                   arama
/giris /kayit /hesabim /hesabim/bildirimler /hesabim/yorumlarim
/yonetim/*             admin
```

`/yayinevi/[slug]` SEO açısından en değerli sayfa: "özdebir deneme takvimi" gibi aramalar yüksek hacimli.

### 4.7 İlan detay sayfası

Öğrencinin sorularını o sırayla cevaplar:

```
[Özdebir logo]  Özdebir TYT-AYT Denemesi 02
Türkiye Geneli · Orta zorluk · 11-12. Sınıf · TYT-AYT

        30 EKİM – 1 KASIM 2026
             23 gün kaldı

Oturumlar     TYT  09:45 · 165 dk · 120 soru
              AYT  14:30 · 180 dk · 160 soru
Son sipariş   14 Ekim 2026
Cevap anahtarı 1 Kasım 2026, 20:00
Dağıtım       İşler Kitabevleri [logo]

[ Takvime ekle ]  [ Bildirim al ]  [ Paylaş ]

★★★★☆ 4.1 (63 değerlendirme)
Yorumlar (onaylı)

Bu seriden diğer ilanlar →
Aynı hafta yapılan diğer sınavlar →
```

"Aynı hafta yapılan diğer sınavlar" önemli: öğrenci çakışma olup olmadığını görmek ister.

**Takvime ekle:** Google Takvim şablon bağlantısı + `.ics` indirme. OAuth yok — Google'ın hassas kapsam doğrulaması haftalar sürer, gereksiz. Ek olarak abone olunabilir akışlar: `/api/ics/koleksiyon/[slug].ics`, `/api/ics/yayinevi/[slug].ics` — kullanıcı bir kez ekler, tarih değişince takvimi kendiliğinden güncellenir.

### 4.8 Bildirim

Dört seviyede abonelik: **tek ilan** · **yayınevi** · **koleksiyon** ("11. sınıfın tüm Türkiye Geneli denemeleri") · **hepsi kapalı**.

Koleksiyon aboneliği en güçlüsü: kullanıcı bir kez abone olur, admin yeni ilan girdikçe otomatik kapsanır.

- Ofsetler: 7 / 3 / 1 gün önce, sınav günü sabahı. Varsayılan 3 ve 1.
- pg-boss günlük planlayıcı (06:00), gönderim 08:00 ±15 dk rastgele.
- **Idempotency zorunlu:** gönderim tablosunda `UNIQUE(abonelikId, ilanId, ofset)`. Sistemin en kırılgan yeri; testi yazılacak.
- Tarih değişirse planlı gönderimler iptal edilip yeniden hesaplanır **ve** abonelere ayrı "tarih değişti" bildirimi gider (tercihten bağımsız, kritik bilgi).
- Her e-postada giriş gerektirmeyen imzalı abonelikten çık bağlantısı.

### 4.9 Yorum

- Giriş + e-posta doğrulaması zorunlu
- İlan başına tek yorum + tek puan (1–5); puan yorumsuz da verilebilir
- **Admin onayından sonra** yayınlanır; ortalama yalnızca onaylılardan, en az 5 puan toplanana kadar gösterilmez
- Kullanıcı adı serbest metin değil, sistem takma adı ("Meraklı Kalem 41")
- Otomatik ön filtre: küfür sözlüğü, kişisel veri deseni (telefon/e-posta/Instagram adı → otomatik ret), bağlantı → bayrak, hız sınırı
- Kullanıcı arası mesajlaşma, takip, profil görüntüleme, yoruma yorum **YOK**

---

## 5. Üç versiyon

Tek kod tabanı, tek API, tek veri katmanı. Fark yalnızca token dosyası ve sayfa düzeni. Aktif versiyon `Ayar` tablosundan; `?tema=v2` ile önizlenir.

**Her üçünde zorunlu:** açık/koyu tema, mobil uyumluluk, kayan şerit, kalıcı düzey filtresi, aynı bileşen kümesi, §3'teki tüm tutarlılık kuralları.

### V1 — "Ajanda"

Fiziksel okul ajandası. Ay ızgarası kahraman öğe; kullanıcı önce zamanı görür.

- **Açık:** kağıt `#EDEEF0` · mürekkep `#131A24` · işaret `#E03131` · vurgu `#FFD43B`
- **Koyu:** `#0F1319` · `#E8EAED` · aynı vurgular %10 düşük doygunluk
- **Tipografi:** Başlık `Bricolage Grotesque` 700 sıkı · Gövde `Inter` · Sayısal `JetBrains Mono`
- **İmza:** Izgaranın üstünde monospace geri sayım, rakamlar yerinde değişir (flip). Hücrelerde yayınevi tonunda noktalar.
- **Düzen:** Ay ızgarası solda geniş, sağda dar sütunda "en yakın ilan" ve filtreler.

### V2 — "Vitrin"

Yayınevi markalarının öne çıktığı magazin düzeni. Logolar baskın.

- **Açık:** `#FFFFFF` · `#0B0B0C` · birincil `#2563EB` · uyarı `#F59E0B` · hat `#E4E4E7`
- **Koyu:** `#0B0B0C` · `#FAFAFA` · birincil `#3B82F6`
- **Tipografi:** Manşet `Archivo Black` · Ara başlık `Archivo` 600 · Gövde `Source Sans 3` · Rozet `Archivo` 500 büyük harf geniş aralık
- **İmza:** En üstte ekranı kesen kalın uyarı bandı — "başvurusu bitiyor" ve "7 gün kaldı" kalemleri kayar; tıklanınca tam ekran yaklaşan ilanlar katmanı açılır. Altında büyük yayınevi logo duvarı.
- **Düzen:** Öne çıkan ilan büyük kart, yanında yaklaşanlar listesi, altında logo ızgarası ve kart akışı.

### V3 — "Akış"

Uygulama gibi, koyu varsayılan, mobil öncelikli akış.

- **Koyu (varsayılan):** `#0E1116` · yüzey `#161B22` · `#E6EDF3` · birincil teal `#14B8A6` · ikincil `#8B5CF6` · aciliyet `#F97316`
- **Açık:** `#F7F8FA` · `#0E1116` · aynı vurgular
- **Tipografi:** Başlık `Space Grotesk` 600 · Gövde `IBM Plex Sans` · Sayısal `IBM Plex Mono`
- **İmza:** Üstte yatay kaydırmalı hafta şeridi (gün gün, o günün ilan sayısı noktalarla). Altta sekme çubuğu: Takvim · Ara · Bildirimler · Profil. Kartlar kaydırıldığında hafifçe ölçeklenir.
- **Düzen:** Tek sütun akış, hafta şeridi yapışkan, liste varsayılan görünüm.

---

## 6. Admin panel

`/yonetim` — tek panel, çok kullanıcı. Roller: **ADMIN** (her şey) · **EDITOR** (içerik) · **MODERATOR** (yalnızca yorum). Yetki kontrolü **hem middleware'de hem server action içinde** — middleware tek başına yeterli değil, action doğrudan çağrılabilir.

### Modüller

**Gösterge paneli** — bugünün ziyaretçi/kayıt sayısı, onay bekleyen yorum, yaklaşan 7 gün, son işlemler.

**İlanlar** — asıl iş ekranı.

- Liste: sezon, kurum, grup, format, zorluk, uygulama tipi, yayın durumu filtreleri; varsayılan sıralama sınav tarihi artan
- Form tek sayfa, §2'deki alanlar. Oturum bölümü varsayılan kapalı.
- **Önizleme:** yayınlamadan önce ilanın sitede nasıl göründüğü, seçili versiyonda
- **Toplu seri girişi:** kurum + grup + format + uygulama tipi bir kez seçilir, sonra satır satır tarih girilir → tek kaydetmede 10 ilan üretilir. 1000+ ilan tek tek girilemeyeceği için bu ekran zorunludur.
- **Yıl kopyalama:** tarihler +1 yıl, taslak olarak açılır
- Excel/CSV içe aktarma: sütun eşleme → doğrulama raporu → onay. Hepsi taslak gelir. Parti kaydıyla toplu geri alınabilir.

**Kurumlar** — CRUD, logo yükleme (sharp ile boyutlandırma + EXIF temizliği), kurum tipi seçimi, vitrin sırası.

**Kurum tipleri** — CRUD. Admin yeni tip ekleyebilir.

**Etiketler** — GRUP/DÜZEY/FORMAT tek ekranda, sekmeyle ayrılmış. Sürükle-bırak sıralama.

**Koleksiyonlar** — filtre kurucu arayüzü + **canlı önizleme**: "bu filtre şu an 47 ilan getiriyor". Önizleme olmadan admin ne tanımladığını göremez. Menü sırası sürükle-bırak.

**Takvim notları** — tatil, bayram, tahmini tarih.

**Yorum moderasyonu** — kuyruk, otomatik filtre skoru ve tetiklenen kural, toplu işlem, klavye kısayolları (`a` onayla, `r` reddet, `j/k` gezin).

**Kullanıcılar** — liste, filtre, askıya alma, veri indirme, hesap silme.

**Bildirimler** — kuyruk, gönderim geçmişi, başarısızları yeniden dene, şablon düzenleme, test gönderimi.

**Ana sayfa düzeni** — blokları sürükle-bırak sırala, aç/kapat, başlık değiştir. Bloklar: sekmeler · kayan şerit · takvim ızgarası · yaklaşanlar · yayınevi logo duvarı · öne çıkan · yorumlar · özel duyuru.

**Görünüm** — aktif versiyon (v1/v2/v3), varsayılan tema, logo, favicon, site adı, kayan şerit eşiği ve hızı.

**Sistem** — denetim kaydı (değiştirilemez), hata kayıtları, rol yönetimi.

---

## 7. SEO, erişilebilirlik, güvenlik

**SEO:** Tüm içerik sayfaları SSR. `schema.org/Event` yapısal verisi. Otomatik sitemap ve RSS. Türkçe karakterden temizlenmiş slug (`ç→c`, `ş→s`, `ı→i`, `ğ→g`, `ü→u`, `ö→o`). Tarihi geçen ilan silinmez, arşive alınır ve sonraki sezona bağlantı verilir. Her ilan için otomatik paylaşım görseli (`@vercel/og`) — sosyal medyada paylaşılabilirlik organik büyümenin ana kanalı.

**Erişilebilirlik (WCAG 2.2 AA):** Klavye ile tam gezinme. Takvim ızgarasında ok tuşu navigasyonu. Görünür odak halkası. `prefens-reduced-motion` her animasyonda. Form hataları alanla ilişkilendirilmiş. Kontrast her iki temada doğrulanmış.

**Performans:** LCP < 2.5s (4G mobil), CLS < 0.1, INP < 200ms. `next/font` self-host. `next/image` AVIF/WebP.

**Güvenlik:** argon2id şifre. CSRF. Hız sınırı (giriş, kayıt, yorum). Zod ile **sunucu tarafında her zaman** doğrulama. Kullanıcı içeriği HTML olarak render edilmez. Yükleme: MIME doğrulama, boyut sınırı, yeniden kodlama, EXIF temizliği. CSP, HSTS.

**KVKK:** Hukuki sebep sözleşmenin ifası (m.5/2-c) — bildirim hizmeti için açık rıza gerekmez, böylece küçüklerin rıza ehliyeti tartışması doğmaz. Açık rıza yalnızca analitik çerezi ve pazarlama için, ayrı ve varsayılan kapalı kutularla. 13 yaş beyanı. Ham IP saklanmaz, tuzlanmış hash. Veri indirme ve hesap silme hesap ayarlarından. Altbilgide: _"Bu site resmî bir kurum sitesi değildir. Tarihler ilgili kurumların duyurularından derlenmiştir; bağlayıcı kaynak kurumun kendi duyurusudur."_

---

## 8. Yapım sırası

| #   | İş                                                                                                                         | Çıktı                   |
| --- | -------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| 1   | Şema + migration + seed (81 il yok — gerek kalmadı; etiketler, kurum tipleri, 45 yayınevi)                                 | Veri hazır              |
| 2   | Token katmanı + temel bileşen kümesi (Card, Badge, Button, Select, Skeleton, EmptyState) + `formatTarih*`                  | Görsel sistem hazır     |
| 3   | 60 demo ilan seed'i (Eylül 2026 – Haziran 2027, birkaçı önümüzdeki 7 gün içinde)                                           | Gerçekçi veri           |
| 4   | **V1 genel site:** takvim (aylık+liste), düzey seçimi, filtre çubuğu, kayan şerit, ilan detay, yayınevi sayfası, açık/koyu | **Gösterilebilir site** |
| 5   | V2 ve V3                                                                                                                   | Üç versiyon             |
| 6   | Admin: giriş, RBAC, ilan CRUD, önizleme, toplu seri girişi                                                                 | Yönetilebilir           |
| 7   | Admin: kurumlar, etiketler, koleksiyonlar (canlı önizlemeli), takvim notları                                               | Tam yönetim             |
| 8   | Üyelik + bildirim (pg-boss, idempotent)                                                                                    | Bildirim çalışıyor      |
| 9   | Yorum + moderasyon                                                                                                         | Topluluk                |
| 10  | Ana sayfa düzeni yönetimi, Excel içe aktarma, analitik                                                                     | Tamamlama               |

**Sıra gerekçesi:** Adım 4 sonunda ekranda gerçek veriyle çalışan bir site olur. Veri modelini bitirip aylarca ekran görmemek yerine, üçüncü adımda demo veriyle dördüncü adımda gösterilebilir çıktı alınır. Admin paneli sonra gelir çünkü demo veri seed'den geliyor.

---

## 9. Kabul kriterleri

1. §3.9 tutarlılık kontrol listesinin tamamı geçiyor; hex ve serbest değer taraması boş dönüyor
2. Admin panelden girilen bir ilan, kod değişikliği olmadan takvimde, listede, kurum sayfasında, ilgili koleksiyonda ve (7 gün içindeyse) kayan şeritte doğru görünüyor
3. Admin yeni bir kurum tipi, etiket veya koleksiyon ekleyebiliyor — migration gerekmiyor
4. Filtre değişimi sunucuya gitmeden anında sonuç veriyor; URL güncelleniyor; geri tuşu çalışıyor
5. Üç versiyon da 360px genişlikte kullanılabilir; her ikisinde de kontrast geçiyor
6. `prefers-reduced-motion: reduce` altında hiçbir otomatik animasyon çalışmıyor
7. Takvim ızgarası yalnızca klavyeyle gezilebiliyor
8. Aynı bildirim iki kez gönderilmiyor (idempotency testi yazılı ve geçiyor)
9. Onaylanmamış yorum sitede görünmüyor ve ortalamaya girmiyor
10. Tarih değişince planlı bildirimler yeniden hesaplanıyor ve abonelere değişiklik bildirimi gidiyor
11. Lighthouse mobil: Performans ≥ 85, Erişilebilirlik ≥ 95, SEO ≥ 95
12. Tema geçişinde sıçrama yok
