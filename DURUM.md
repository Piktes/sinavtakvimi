# Durum ve yol haritası

Şartname: `docs/SINAV-ILAN-PLATFORMU.md` (§ referansları oraya).
Kurulum: `KURULUM.md`.

Yapım sırası şartname §8'deki tabloyu izler.

---

## Tamamlanan

### Adım 1 — Şema + migration + seed

12 tablo (§2): `KurumTipi`, `Kurum`, `Etiket`, `Ilan`, `Oturum`, `Koleksiyon`,
`TakvimNotu`, `Kullanici`, `Abonelik`, `Gonderim`, `Yorum`, `Ayar`,
`DenetimKaydi` + Auth.js tabloları.

- `Etiket` **tek taksonomi tablosu**; GRUP / DÜZEY / FORMAT `tip` ile ayrılır.
- `Gonderim`, §2'nin 10 tablo hedefi dışında ama §4.8 idempotency'yi açıkça
  şart koştuğu için var: `UNIQUE(abonelikId, ilanId, ofset)`.
- Migration elle tamamlandı (Prisma bunları üretemiyor):
  - Türkçe ICU collation — `etiketler/kurumlar/ilanlar/kurum_tipleri/
    koleksiyonlar/takvim_notlari` üzerindeki `ad`/`baslik`
  - `ilanlar_bitis_sinavdan_sonra` (bitiş > sınav tarihi)
  - `abonelikler_hedef_xor` (`num_nonnulls(ilan, kurum, koleksiyon) = 1`)
  - `yorumlar_puan_araligi` (1–5)

Seed: 6 kurum tipi, 40 etiket, 47 kurum, 14 koleksiyon, `aktif_versiyon`
ayarı, admin.

### Adım 2 — Token katmanı + temel bileşenler

`src/styles/tokens/` tek ham değer kaynağı. `temel.css` ölçekleri (boşluk,
tipografi, yarıçap, gölge, hareket) tutar; renk ve yazı tipi atamaları
versiyon dosyalarındadır.

§3.7 tek bileşen kuralı: `Button`, `Badge`, `Card`, `Select`, `Skeleton`,
`EmptyState` — her işi yapan tek bileşen.

`pnpm tutarlilik` (§3.9) tokens/ dışında hex, serbest Tailwind değeri,
bileşende `dark:` ve ham `toLocaleDateString` arar.

### Adım 3 — 66 demo ilan

15 gerçekçi seri, oturumlarıyla. Tarihler **çalıştırma gününe göre** üretilir.

### Adım 4 — V1 genel site

Sayfalar: `/`, `/takvim`, `/takvim/[yil]/[ay]`, `/ilan/[slug]`,
`/yayinevi/[slug]`, `/k/[slug]`.

- §4.2 kalıcı düzey seçimi (çerez, tüm sayfalarda varsayılan filtre)
- §4.3 istemci tarafı filtreleme + URL senkronu
- §4.4 aylık ızgara (ok tuşlarıyla gezinme) + liste (mobil varsayılanı)
- §4.5 kayan şerit (CSS transform), tasarlanmış boş durumlar, sunucu
  zamanından geri sayım

### Adım 5 — V2 "Vitrin" ve V3 "Akış"

Tek kod tabanı; fark yalnızca token dosyası ve sayfa düzeni. Aktif versiyon
`Ayar.aktif_versiyon`, `?tema=v2` ile önizlenir (`src/middleware.ts`).

### Adım 6 — Admin: giriş, RBAC, ilan CRUD, önizleme, toplu seri girişi

Auth.js v5 + Credentials, argon2id. `/yonetim` altındaki her şey korumalı.

- **İki katmanlı yetki**: `src/middleware.ts` (Edge, rota→rol kaba kapı) +
  `src/lib/rbac.ts:requireRol` (her sayfa/action içinde, **rol ve hesap
  durumu DB'den okunur**).
- İlk girişte zorunlu şifre değiştirme (`sifreDegistirmeZorunlu`).
- Gösterge paneli, ilan CRUD (7 filtre + arama), önizleme, yıl kopyalama,
  toplu seri girişi.
- Her mutasyon `src/lib/denetim.ts:denetimYaz` üzerinden `DenetimKaydi`
  yazar; IP tuzlanmış hash olarak saklanır, şifre hash'i kayda girmez.

**Şartnameden sapma — "database session" yerine JWT + DB doğrulaması.**
§1 "Auth.js v5, database session" diyor ancak `@auth/core` 0.41.3'te
Credentials sağlayıcısı **koşulsuz JWT üretiyor**
(`lib/actions/callback/index.js`: `callbacks.jwt` → `jwt.encode` → çerez;
`adapter.createSession` bu dalda hiç çağrılmıyor). `session.strategy` ne
olursa olsun değişmiyor. Bu yüzden strateji `"jwt"`; database session'ın asıl
kazanımı olan **anında iptal edilebilirlik** `requireRol` ile korunuyor: rol
ve `durum` her korumalı istekte DB'den okunur, token'daki değere güvenilmez.
Askıya alınan hesap elindeki JWT geçerli olsa bile anında kesilir.
Sapmadan memnun değilsen alternatif: Auth.js'i bırakıp kendi
`Session` tablosu + çerez akışını yazmak (tablolar şemada zaten var).

---

## Sırada

### Adım 7 — Admin: kurumlar, etiketler, koleksiyonlar, takvim notları

- Kurumlar CRUD + logo yükleme (sharp ile boyutlandırma + **EXIF temizliği**,
  §7). Yüklenen logolar `public/uploads/` (prod'da S3/R2'ye taşınacak).
- Kurum tipleri CRUD (admin yeni tip ekleyebilmeli — enum değil, tablo).
- Etiketler: GRUP/DÜZEY/FORMAT tek ekranda sekmeyle, sürükle-bırak sıralama.
- **Koleksiyonlar: filtre kurucu + canlı önizleme** ("bu filtre şu an 47 ilan
  getiriyor"). §6: "bu listedeki en önemli ekran — önizleme olmadan admin ne
  tanımladığını göremez." Filtre şeması
  `src/lib/validations/koleksiyon.ts:koleksiyonFiltresiSemasi`; Prisma
  where'ine çeviren fonksiyon `src/lib/veri/ilan.ts:filtreyiWhereCevir`
  (aynı fonksiyon önizlemede de kullanılmalı, ikinci bir yorum yazılmamalı).
- Takvim notları CRUD (tatil/bayram/tahmini) — aylık ızgarada bant olarak
  zaten render ediliyor, veri girişi eksik.

### Adım 8 — Üyelik + bildirim

- Kayıt/giriş, e-posta doğrulama, 13 yaş beyanı (§7 KVKK).
- Takma ad **havuzdan atanır**, serbest metin değil (§4.9).
- Dört seviyeli abonelik: tek ilan · yayınevi · koleksiyon · kapalı.
- pg-boss günlük planlayıcı (06:00), gönderim 08:00 ±15 dk.
- **Idempotency zorunlu** — `Gonderim` tablosundaki unique kısıt korunmalı;
  §4.8 "sistemin en kırılgan yeri, testi yazılacak" diyor.
- Tarih değişirse planlı gönderimler iptal + yeniden hesap **ve** abonelere
  ayrı "tarih değişti" bildirimi.
- Her e-postada giriş gerektirmeyen imzalı abonelikten çık bağlantısı.
- İlan detayındaki "Takvime ekle" burada etkinleşir: Google Takvim şablon
  bağlantısı + `.ics` (OAuth **yok**, §4.7) + abone olunabilir akışlar
  `/api/ics/koleksiyon/[slug].ics`, `/api/ics/yayinevi/[slug].ics`.

### Adım 9 — Yorum + moderasyon

- İlan başına tek yorum + tek puan; puan yorumsuz da verilebilir.
- **Admin onayından sonra** yayınlanır; ortalama yalnızca onaylılardan ve
  en az 5 puan toplanana kadar gösterilmez.
- Otomatik ön filtre: küfür sözlüğü, kişisel veri deseni (telefon/e-posta/
  Instagram → otomatik ret), bağlantı → bayrak, hız sınırı.
- Moderasyon kuyruğu: toplu işlem + klavye kısayolları (`a` onayla,
  `r` reddet, `j/k` gezin).
- `Ilan.puanOrtalama`/`puanSayisi` denormalize alanları onaylı yorumlardan
  yeniden hesaplanmalı.

### Adım 10 — Ana sayfa düzeni, Excel içe aktarma, analitik

- `HomepageBlock` benzeri blok yönetimi: sürükle-bırak sırala, aç/kapat.
  (Şu an ana sayfa blok sırası kodda sabit — §5.9'un "admin yönetir"
  gereğini henüz karşılamıyor.)
- Excel/CSV içe aktarma: sütun eşleme → doğrulama raporu → onay; hepsi
  taslak gelir, parti kaydıyla toplu geri alınabilir.
- Analitik.

---

## V1'de bilinçli olarak ertelenenler

Şartnamede var, Adım 4'te kapsam dışı bırakıldı:

- Mobil filtre alt sayfası (bottom sheet) — §5.10
- Komut paleti `Cmd/Ctrl+K` — §4.5
- `/ara` arama sayfası — §4.6
- Haftalık görünüm — §4.4 (aylık ve liste var)
- View Transitions API ile görünüm geçişleri — §4.4
- `@vercel/og` ile otomatik paylaşım görseli, sitemap, RSS — §7

---

## Bilinen tuzaklar

**`src/middleware.ts`** — `src/app` kullanan projelerde middleware `src/`
altında olmalı. Kök dizindeki `middleware.ts` **sessizce yok sayılır**; hata
vermez, sadece çalışmaz. `curl -D - "http://localhost:3000/?tema=v2"` ile
`Set-Cookie` başlığına bakarak doğrula.

**Prisma istemcisi git'te değil** — `src/generated/` `.gitignore`'da.
`pnpm install` (postinstall) ya da `pnpm exec prisma generate` şart.

**`prisma/seed.ts` uzantılı import kullanır** (`../src/lib/slug.ts`) — `tsx`
altında ESM olarak çalıştığı için zorunlu. `tsconfig.json`'da
`allowImportingTsExtensions: true` bu yüzden açık.

**Doğrudan `tsx` ile çalışan dosyalar `.env`'i kendileri yüklemeli** —
`prisma db seed` `prisma.config.ts` üzerinden dotenv'i yüklüyor ama
`pnpm db:seed-demo` doğrudan çalıştığı için `seed-demo.ts` başında
`import "dotenv/config"` var.

**Next 16 değil 15** — `create-next-app@latest` 16 kuruyor; şartname §1
Next.js 15 diyor, sürüm bilinçli olarak sabitlendi.

**`@db.Date` sütunları UTC gece yarısı olarak okunur** — `src/lib/tarih.ts`
tüm biçimlendirmeyi tek yerden yapar. §3.7 gereği hiçbir bileşende
`toLocaleDateString` çağrılmaz; `pnpm tutarlilik` bunu denetler.

**Geri sayım sunucu zamanından** — `kalanGun(hedef, simdi)` imzasındaki
`simdi` parametresi zorunlu; istemci saatine güvenilmiyor (§4.5).
