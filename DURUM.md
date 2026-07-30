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

### Adım 7 — Admin: kurumlar, etiketler, koleksiyonlar, takvim notları

Şartnamenin "sitede görünen hiçbir şey kodda sabit olmayacak" ilkesi artık
gerçekten sağlanıyor: taksonominin tamamı admin panelden yönetiliyor.

- **Kurumlar** CRUD + logo yükleme (`src/lib/gorsel-yukle.ts`: sharp ile
  yeniden kodlama → EXIF/konum verisi düşer, §7) + vitrin sırası.
  İlanı olan kurum silinemez.
- **Kurum tipleri** CRUD — §2'nin "enum değil, tablo" kararının karşılığı.
- **Etiketler** — GRUP/DÜZEY/FORMAT tek ekranda sekmeli. Kullanımdaki etiket
  silinemez (pasife alınır).
- **Koleksiyonlar** — filtre kurucu + **canlı önizleme**. Önizleme ile gerçek
  sorgu AYNI fonksiyonu kullanır (`filtreyiWhereCevir`); ikinci bir yorum
  yazılmadı, yoksa önizleme yalan söyleyebilirdi. Doğrulandı: filtresiz 66 →
  YKS 28 → YKS+Zor 14.
- **Takvim notları** CRUD — aylık ızgarada bant olarak render ediliyordu,
  artık veri girişi de var.

Kabul kriteri #2 ve #3 tarayıcıda doğrulandı: panelden eklenen koleksiyon,
kod değişikliği ve migration olmadan sitenin üst menüsünde belirdi.

### Ek — Excel/CSV içe aktarma (§4.2, sıradan öne alındı)

Yol haritasında Adım 10'daydı; toplu veri girişini kolaylaştırdığı için erken
yapıldı.

- **Şablon indirme** (`/yonetim/ilanlar/ice-aktar/sablon`): sütun başlıkları +
  hangi alanın zorunlu olduğu + panelde KAYITLI GERÇEK kurum/etiketlerden
  üretilmiş örnek satır. İndirilen dosya olduğu gibi yüklendiğinde geçerli.
  UTF-8 BOM + noktalı virgül — Türkçe Excel'in beklediği biçim (BOM'suz Excel
  ç/ş/ğ'yi bozuk gösterir, virgülle yazılan dosyayı tek sütuna sıkıştırır).
- **İki adımlı akış**: yükle → rapor (hiçbir şey kaydedilmez) → onayla.
  Aktarılanlar TASLAK gelir.
- **Satır/sütun bazlı hata raporu**: satır numarası Excel'dekiyle aynı,
  hangi sütun, ne girilmiş, neden geçersiz. Bir satırdaki tüm hatalar aynı
  anda gösterilir (kullanıcı tek tek deneme yapmasın).
- Tarih esnekliği: `GG.AA.YYYY`, `GG/AA/YYYY`, `YYYY-AA-GG` kabul edilir;
  takvimde olmayan gün (31.02) reddedilir.
- Kurum/etiket eşleşmesi ad veya slug üzerinden, Türkçe büyük/küçük harf
  katlamasıyla (`"I".toLowerCase()` İngilizce'de `i` verir, Türkçe'de `ı`
  olmalı — `toLocaleLowerCase("tr")` kullanılıyor).
- Çakışma tespiti: aynı slug DB'de varsa ayrıca listelenir, "atla" seçeneği
  sunulur.
- `src/lib/csv.ts` bağımlılıksız (tırnaklı alan, gömülü ayraç/satır sonu,
  çift tırnak kaçışı) — 18 birim testiyle kapsanmış.

**Toplu geri alma** (§4.2 "hatalı yükleme tek işlemle geri alınır"):
her yükleme `IceAktarmaPartisi` olarak kaydedilir, `Ilan.iceAktarmaPartisiId`
ile ilanlar partiye bağlanır. `/yonetim/ilanlar/ice-aktar/gecmis` ekranından
tek tıkla geri alınır.

Güvenlik tercihi: geri alma yalnızca **hâlâ TASLAK** olan ilanları siler.
Admin bir ilanı yayınladıysa/arşivlediyse bilinçli karar vermiştir; toplu
işlem onu sessizce silmemeli. Sonuç mesajı ikisini ayrı bildirir
("2 taslak silindi, 1 yayınlanmış ilan korundu"). Parti kaydı silinmez,
GERI_ALINDI olarak işaretlenir — izlenebilirlik korunur.

`IceAktarmaPartisi`, §2'nin 10 tablo hedefi dışında; §4.2 geri almayı açıkça
şart koştuğu ve hangi ilanın hangi yüklemeden geldiği kaydedilmeden bu
mümkün olmadığı için eklendi (`Gonderim` ile aynı gerekçe).

### Adım 8 — Üyelik + bildirim

**8a — bitti.** `lib/takma-ad.ts` (havuz üreteci), `lib/eposta.ts` (nodemailer;
SMTP yapılandırılmamışsa konsola düşer, sessizce kaybolmaz), `lib/imzali-baglanti.ts`
(HMAC + `timingSafeEqual`, DB'de token tutmadan giriş gerektirmeyen bağlantılar).

**8b — bitti.** `/kayit`, `/giris`, `/eposta-dogrula`, `/hesabim`; üst barda
takma ad / Giriş bağlantısı. Kararlar:

- Doğrulama jetonu Auth.js'in mevcut `verification_tokens` tablosunda tutuluyor
  (`expires` alanı zaten var), 48 saat, **tek kullanımlık**.
- Kayıt ve "bağlantıyı tekrar gönder" e-posta kayıtlı olsun olmasın **aynı
  mesajı** döndürüyor — hesap sayımı (enumeration) engelleniyor (§7).
- Genel üye (`rol = KULLANICI`) e-postasını doğrulamadan **giriş yapamaz**;
  panel rolleri bu kontrolün dışında (admin hesapları elle açılıyor).
- Şifre değişince `oturumSurumu` artıyor → diğer cihazlardaki oturumlar bir
  sonraki istekte kesiliyor. Tarayıcıda doğrulandı: açık ikinci sekme yenilenince
  `/giris`e düştü.
- `lib/rbac.ts`'e `requireUye()` / `uyeVarsa()` eklendi — panel `requireRol()`'ünün
  genel site karşılığı, aynı DB doğrulamasını yapıyor.

**8c — bitti.** `lib/ics.ts` (bağımlılıksız RFC 5545 üreteci, 18 test) +
`lib/veri/ics.ts` + `/api/ics/{ilan,yayinevi,koleksiyon}/[slug].ics`.
İlan detayında "Takvime ekle" menüsü (Google Takvim şablonu · .ics indir ·
yayınevi akışına abone ol); yayınevi ve koleksiyon sayfalarında "Takvime
abone ol". Dikkat edilenler:

- **DTEND tüm-gün olaylarda dışlayıcıdır** — 12 Nisan'da biten sınav için
  13 Nisan yazılır, yoksa takvimde son gün eksik görünür.
- Satır katlama **bayt** sayar, karakter değil: "ğ" UTF-8'de 2 bayt, karakter
  sayılırsa 75 oktetlik sınır aşılır ve bazı istemciler dosyayı reddeder.
- UID `ilan-<id>@sinavilan` — kalıcı; tarih değişince istemci aynı olayı
  günceller, ikinci kayıt oluşturmaz.
- Koleksiyon akışı ile koleksiyon sayfası **aynı `filtreyiWhereCevir`**
  fonksiyonundan geçer; ayrı bir çeviri yazılsaydı akış sessizce farklı bir
  küme döndürebilirdi.
- Google Takvim tarafında **OAuth yok** (§4.7) — yalnızca şablon bağlantısı.

**8d — bitti.** Dört seviyeli abonelik (§4.8): tek ilan · yayınevi · koleksiyon ·
kapalı. `lib/abonelik.ts` (sabitler) + `(genel)/abonelik-actions.ts` +
`components/bildirim-dugmesi.tsx`; ilan detayı, yayınevi ve koleksiyon
sayfalarında. Kararlar:

- **"Kapalı" ayrı bir kayıt değil, kaydın yokluğu.** Menüde dördüncü bir radyo
  düğmesi yerine tek bir "Bildirimi kapat" eylemi var; DB'de kayıt silinir,
  bekleyen `Gonderim` satırları cascade ile gider.
- Ofsetler yalnızca 7/3/1/0 (§4.8), varsayılan 3 ve 1. Sunucuda Zod ile
  süzülüyor — her ofset ayrı planlanmış gönderim demek, keyfi değer kabul
  edilemez.
- `hedefGecerliMi()`: istemciden gelen id yayında/aktif mi diye doğrulanıyor,
  yoksa rastgele id ile yetim abonelik açılabilirdi.
- Doğrulanmamış e-postaya abonelik açılmaz. Genel üye zaten doğrulamadan giriş
  yapamıyor; bu kural pratikte **doğrulanmamış panel hesapları** için geçerli.
- Girişsiz kullanıcı düğmeyi görür; tıklayınca `/giris?devam=<mevcut yol>`.

**Düzeltilen hata:** açılır menüler `z-20` idi, yapışkan filtre çubuğu da
`z-20` (`takvim/filtre-cubugu.tsx`) — koleksiyon sayfasında filtre çubuğu
menüyü kapatıyordu. Üç menü de `z-40`'a alındı (yapışkan üst bar z-30).

**8e — bitti.** pg-boss planlayıcı + idempotent gönderim + testleri.
`lib/bildirim/` altında: `zamanlama.ts` (saf, 16 test), `tekillestir.ts`
(saf, 9 test), `planlayici.ts`, `gonderici.ts`, `sablon.ts`, `isci.ts`.
`pnpm worker` ayrı süreç; `pnpm bildirim:planla [--gonder]` elle tetikler.

- **Planlama ≠ gönderme.** Planlayıcı yalnızca `Gonderim` satırı yazar.
  Gönderim SMTP yüzünden düşerse satır BEKLIYOR kalıp tekrar denenir;
  planlama yeniden koşsa bile UNIQUE ikinci satırı engeller.
- **Saçılma rastgele değil, anahtardan türetilir** (`gonderimAni`). Rastgele
  olsaydı yeniden planlamada `planlanan` kayar, "iki kez gönderdik mi?"
  sorusu cevaplanamazdı.
- **Sahiplenme atomik**: `UPDATE ... WHERE durum='BEKLIYOR' ... FOR UPDATE
SKIP LOCKED RETURNING`. İki işçi aynı satırı alamaz; alamayan e-postayı
  hiç denemez.
- SMTP yapılandırılmamışsa satır `IPTAL` olur (BEKLIYOR'a geri koymak sonsuz
  döngü, GONDERILDI demek yalan olurdu).
- `askidaKalanlariKurtar()`: işçi çökerse GONDERILIYOR'da kalan satırlar
  30 dk sonra BEKLIYOR'a döner.

**Şartname dışı ama gerekli düzeltme — seviyeler arası tekilleştirme.**
§4.8'in UNIQUE'i `(abonelikId, ilanId, ofset)`; kullanıcı hem tek ilana hem
o ilanı kapsayan koleksiyona abone olduğunda **aynı sabah iki e-posta**
gidiyordu (tarayıcıda görüldü). `tekillestir.ts` (kullanıcı, ilan, ofset)
üçlüsünü tekilleştiriyor, **en spesifik abonelik kazanıyor** — böylece
"abonelikten çık" bağlantısı da doğru hedefi gösteriyor.

**Testler:** `pnpm test` 123 (DB'siz), `pnpm test:db` 14 — ikincisi §4.8'in
"testi yazılacak" dediği idempotency kanıtı. Sahte istemciyle sınamak bir şey
kanıtlamazdı; kanıtlanması gereken **Postgres kısıtının kendisi**.

**8f — bitti.** Tarih değişikliği (§4.8). `lib/bildirim/tarih-degisikligi.ts`

- `lib/bildirim/kuyruk.ts`; `ilanKaydet` içine bağlandı.

* **İptal SENKRON, bildirim KUYRUKTA.** İptal tek bir `updateMany` —
  yanlış tarihe göre planlanmış hatırlatma bir an bile kuyrukta kalmamalı.
  Bildirim pg-boss'a atılıyor: yüzlerce aboneye SMTP üzerinden yazmak admin'in
  kaydet formunu dakikalarca bekletir, SMTP düşerse admin kaydı başarısız
  sanardı. İşçi çalışmıyorsa iş kuyrukta bekler, kaybolmaz.
* **GONDERILDI satırına dokunulmuyor** — kullanıcı onu zaten almış; silmek
  geçmişi yeniden yazmak ve idempotency kaydını bozmak olurdu.
* "Tarih değişti" e-postası **ofset tercihinden bağımsız** gider (§4.8
  "kritik bilgi"); ayrı şablon.
* Aynı kullanıcı üç seviyeden de abone olsa **tek** bildirim alır.
* Kuyruk erişilemezse ilan kaydı **başarısız olmuyor** — bildirim altyapısı
  içerik yönetimini kilitlememeli; konsola düşüyor ki sessiz kalmasın.

**Planlayıcı sayaçları ayrıldı** (test yanlış şeyi ölçtüğü ortaya çıktı):
`atlananGonderim` = UNIQUE'e takılanlar, `tekillestirilen` = aynı turda başka
seviyeden gelenler, `zatenPlanlanmis` = DB'de zaten satırı olanlar. Üçü ayrı
savunma katmanı; tek sayaçta toplamak hangisinin çalıştığını gizliyordu.

**Adım 8 tamamlandı.** `pnpm test` 129, `pnpm test:db` 18.

---

### Adım 9 — Yorum + moderasyon

`lib/moderasyon/` (on-filtre, puan, puan-hesapla, hiz-siniri) +
`(genel)/yorum-actions.ts` + `components/yorum-bolumu.tsx` ·
`/hesabim/yorumlarim` · `/yonetim/yorumlar`.

- **Ön filtre karar verici değil, ön eleyici.** TEMIZ çıksa bile yorum
  BEKLIYOR kaydedilir — §4.9 "admin onayından sonra yayınlanır" diyor,
  filtre bunu atlatmaz. Filtrenin işi kuyruğu sıralamak ve açık ihlalleri
  baştan REDDEDILDI işaretlemek.
- Kişisel veri (telefon/e-posta/@kullanıcı/whatsapp) → **otomatik ret**;
  bağlantı → **bayrak** (ret değil, moderatör karar verir). Aksan katlaması
  ve rakam-kaçamağı (`s1kt1r`) açılıyor; `mal`/`sik`/`got` gibi kısa kökler
  yalnız tam kelime eşleşmesinde sayılıyor ("malzeme" yakalanmıyor).
- **Tek yorum kuralı güncellemedir, hata değil.** İkinci gönderim mevcut
  kaydı günceller ve yeniden BEKLIYOR'a düşürür — onaylı bir yorumu
  değiştirip moderasyonu atlatmak mümkün olmamalı.
- Hız sınırı `yorumlar` tablosundan okunuyor, bellekten değil: sunucu
  yeniden başlayınca sınır sıfırlanmasın. Hem kullanıcıya hem IP hash'ine
  bakılıyor (çok hesap açarak aşmayı engellemek için).
- `Ilan.puanOrtalama`/`puanSayisi` **tek fonksiyondan** hesaplanıyor
  (`puanlariYenidenHesapla`); yorum durumunu değiştiren her yol oradan
  geçiyor. Ortalama 5 puana kadar gizli (§4.9), sayı gizli değil.
- Moderasyon kuyruğu skor sırasına göre; klavye `j/k` gez, `x` seç,
  `a` onayla, `r` reddet, `s` spam. Seçim varsa kısayol tümüne uygulanır.
  Form alanındayken kısayollar devre dışı.
- §12.3 yasak listesi korundu: yoruma yorum, profil bağlantısı, takip yok.
  Yazar yalnızca sistem takma adıyla görünüyor.

**Düzeltilen hata (Adım 2'den kalma, tüm ekranları etkiliyordu):** Button
ölçeği TERS dönmüştü — `sm` 48px, `md` 36px, `lg` 44px. Sebep: proje
`--spacing-1..8`i semantik bir ramp'e bağlamış (`--space-7: 48px`), ama
Button `h-7 / h-9 / h-11` yazıyordu; `h-7` ramp'e, `h-9`/`h-11` Tailwind
varsayılanına düşüyordu. Kontrol yükseklikleri artık ayrı token ramp'inden
okunuyor (`--kontrol-sm/md/lg`, `h-kontrol-*`). Input, Select ve ilan
detayındaki satır içi `h-9` da aynı ramp'e alındı.

**Küçük düzeltme:** moderasyon kuyruğunda son öğe karara bağlanınca liste
boşalıyor ve sonuç mesajı erken `return`'e takılıp kayboluyordu.

---

## Sırada

### Adım 10 — Ana sayfa düzeni, analitik

- `HomepageBlock` benzeri blok yönetimi: sürükle-bırak sırala, aç/kapat.
  (Şu an ana sayfa blok sırası kodda sabit — §5.9'un "admin yönetir"
  gereğini henüz karşılamıyor.)
- Analitik: `VisitEvent`/`DailyMetric` benzeri toplama + §6 gösterge
  panelindeki ziyaretçi/kayıt sayıları (şu an yalnızca ilan/yorum sayaçları
  gerçek, ziyaretçi metrikleri yok).

> Excel/CSV içe aktarma bu adımdaydı; erken yapıldı (yukarıdaki "Ek" bölümü).
> Kalan tek parçası yoktu — şablon, doğrulama raporu ve toplu geri alma dahil
> tamamlandı.

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

**`server-only` işaretli modüller Node'da import edilemez** — paket kasten
hata fırlatır. `pnpm worker` ve `pnpm bildirim:planla` bu yüzden
`tsx --conditions=react-server` ile koşar (paket o koşulda boş modüle
çözülür); `pnpm test:db` aynı işi `vitest.db.config.ts` içindeki alias ile
yapar.

**Kuyruğa `import "dotenv/config"` İLK import olmalı** — `config()` çağrısı
olarak yazılırsa ESM tüm import'ları gövdeden önce değerlendirdiği için
`@/lib/prisma` `DATABASE_URL` okunmadan başlatılır ve
`SASL: client password must be a string` alınır.

**Açılır menüler `z-40`** — yapışkan üst bar `z-30`, yapışkan filtre çubuğu
`z-20`. Menüye `z-20` verildiğinde koleksiyon sayfasında filtre çubuğu menüyü
kapatıyordu.

**Bildirim işçisi web sunucusundan ayrı süreç** — `pnpm worker`. Next süreci
içinde başlatılsaydı dev'de her yeniden derlemede zamanlayıcı yeniden kurulur,
üretimde de her sunucu örneği aynı cron'u çalıştırırdı. Web süreci kuyruğa
yalnızca **iş atar** (`lib/bildirim/kuyruk.ts`).

**Buton/kontrol yükseklikleri `--kontrol-*` ramp'inden** — boşluk ölçeğinden
DEĞİL. `--spacing-1..8` semantik bir ramp'e bağlı (`--space-7: 48px`), bu
yüzden `h-7`/`size-7` gibi çıplak Tailwind basamakları kontrol yüksekliği
için kullanılamaz. `h-kontrol-sm/md/lg` kullanın (bkz. `temel.css`).
