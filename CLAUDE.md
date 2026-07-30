@AGENTS.md

# Sınav İlan Platformu

Yayınevleri ve eğitim kurumlarının **deneme sınavı ilanlarını** yayınladığı,
öğrencilerin takvim üzerinde takip ettiği bir ilan panosu.

**Bu bir resmî sınav süreç takipçisi DEĞİL.** Başvuru penceresi, giriş belgesi,
tercih dönemi, sınav merkezi ataması gibi kavramlar bu ürüne ait değildir ve
modellenmez.

Ölçek: sezonda 800–1200 ilan, 45+ yayınevi. Bu sayı **filtrelemeyi ürünün
merkezine** koyar.

## Önce bunları oku

| Dosya | İçerik |
|---|---|
| `docs/SINAV-ILAN-PLATFORMU.md` | **Şartname.** Tüm § referansları buraya. |
| `DURUM.md` | Ne yapıldı, sırada ne var, bilinen tuzaklar. |
| `KURULUM.md` | Yeni makinede kurulum + sorun giderme. |

Bir göreve başlamadan önce şartnamenin ilgili bölümünü oku. Şartnameyle
çelişen bir durum fark edersen **kod yazmadan önce sor**; sessizce yorumlama.

## Komutlar

```bash
pnpm dev            # geliştirme sunucusu
pnpm build          # üretim derlemesi
pnpm db:migrate     # migration uygula
pnpm db:seed        # statik referans verisi (idempotent)
pnpm db:seed-demo   # 66 demo ilan (idempotent, tarihler bugüne göre)
pnpm test           # birim testleri (vitest)
pnpm test:e2e       # Playwright
pnpm lint
pnpm tutarlilik     # §3.9 görsel tutarlılık denetimi
```

**Commit öncesi dördü de temiz olmalı:** `lint`, `build`, `test`, `tutarlilik`.

## Değişmez kurallar

1. **§3 görsel sistem bölümü öneri değil, kısıttır.** Bileşende hex kodu,
   serbest Tailwind değeri (`p-[13px]`, `bg-[#fff]`), satır içi renk stili
   veya `dark:` öneki **yasak**. Hepsi `src/styles/tokens/` altındaki
   değişkenlerden okunur. `pnpm tutarlilik` bunu denetler.
2. **Tek bileşen kuralı.** Aynı işi yapan iki bileşen olmaz — tek `Button`,
   tek `Badge`, tek `Card`, tek `Select`, tek `Skeleton`, tek `EmptyState`.
   Varyasyon prop ile yapılır, kopya bileşenle değil.
3. **Tarih biçimlendirme yalnızca `src/lib/tarih.ts` üzerinden.** Hiçbir
   bileşende `toLocaleDateString` çağrılmaz. DB'de UTC, arayüzde
   Europe/Istanbul (sabit UTC+3).
4. **Geri sayım sunucu zamanından hesaplanır.** `kalanGun(hedef, simdi)`
   imzasındaki `simdi` zorunlu — istemci saatine güvenilmez.
5. **Zod ile doğrulama her zaman sunucu tarafında.** İstemci doğrulaması
   yalnızca kullanıcı deneyimi içindir.
6. **Yetki kontrolü hem middleware'de hem server action içinde.** Middleware
   tek başına yeterli değil; action doğrudan çağrılabilir.
7. **Ham IP asla saklanmaz** — tuzlanmış hash (`IP_HASH_SALT`).
8. **Kullanıcı içeriği HTML olarak render edilmez.**
9. **İkonlar yalnızca Lucide**, `strokeWidth={1.75}`, boyut 16/20/24.
10. **Üç versiyon tek kod tabanıdır.** Fark yalnızca token dosyası ve sayfa
    düzeni; bileşenler hangi versiyonda olduklarını bilmez.

## Yığın

Next.js **15** (App Router) · TypeScript · Tailwind v4 · Prisma 7
(driver adapter zorunlu) · PostgreSQL 16 · Auth.js v5 · Zod · Motion ·
Lucide · pg-boss (Redis yok) · Nodemailer + React Email

Geliştirme Windows, yayın Ubuntu VPS. Dosya adları küçük harf-tire, import
yolları birebir (Linux harf duyarlı). `.gitattributes` ile LF.

## Mimari

```
src/
  app/
    (genel)/          genel site — layout üst bar + koleksiyon sekmeleri
    layout.tsx        kök: yazı tipleri, data-versiyon, data-tema
    tercih-actions.ts düzey/tema çerez server action'ları
  components/
    ui/               §3.7 tek bileşen kümesi
    takvim/           ızgara, liste, filtre çubuğu, filtre mantığı (saf)
    ana-sayfa/        versiyona özel ana sayfa düzenleri
  lib/
    veri/ilan.ts      tüm ilan sorguları + IlanOzet tipi
    tarih.ts          TEK tarih biçimlendirme kaynağı
    sezon.ts          sinavTarihi → "2026-2027" (kesme noktası 1 Ağustos)
    slug.ts           Türkçe → ASCII slug
    kurum-tonu.ts     §3.6 slug → deterministik renk tonu
    versiyon.ts       aktif versiyon çözümleme
    validations/      Zod şemaları (istemci+sunucu ortak)
  styles/tokens/      temel ölçekler + v1/v2/v3 renk & yazı tipleri
  middleware.ts       ?tema=vN önizleme çerezi
```

**Veri akışı (§4.3):** ayın ilanları sunucudan **bir kez** gelir, filtreler
**istemcide** uygulanır, durum URL'e yazılır. Ay değişince sunucudan yeni veri.

**Taksonomi:** `Etiket` tek tablo, GRUP/DÜZEY/FORMAT `tip` ile ayrılır.
Kurum tipi de tablo (enum değil) — admin migration olmadan ekleyebilmeli.
Enum kalanlar yalnızca **davranışı değiştirenler**: `uygulamaTipi`, `zorluk`,
`yayinDurumu`.

**Koleksiyon = kayıtlı filtre.** Üst menü sekmeleri admin tanımlıdır; `filtre`
jsonb'si serbest değil, `src/lib/validations/koleksiyon.ts`'te Zod ile
tiplenmiştir. Prisma where'ine çeviren tek fonksiyon:
`src/lib/veri/ilan.ts:filtreyiWhereCevir`.

## Çalışma biçimi

- Görevler küçük tutulur, her anlamlı adımdan sonra commit atılır.
- Yeni bağımlılık eklemeden önce gerekçesi söylenir.
- Şema değişikliği daima migration ile. Prisma `@@check` desteklemiyor —
  CHECK kısıtları ve ICU collation elle yazılmış migration'a eklenir.
