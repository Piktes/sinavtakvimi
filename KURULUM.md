# Kurulum — yeni geliştirme makinesi

Depoyu klonladıktan sonra bu dosyayı baştan sona uygula. Şartname
`docs/SINAV-ILAN-PLATFORMU.md`; ne yapıldığı ve sırada ne olduğu `DURUM.md`.

## Gereksinimler

| Araç | Sürüm | Not |
|---|---|---|
| Node.js | 20+ | 24.13 ile geliştirildi |
| pnpm | 9.15.9 | `npm i -g pnpm` (Corepack'e güvenme, sürüm çakışabiliyor) |
| PostgreSQL | 16 | ICU collation desteği gerekli (§2 Türkçe sıralama) |

## 1. Bağımlılıklar

```bash
pnpm install
```

`postinstall` otomatik olarak `prisma generate` çalıştırır ve Prisma istemcisini
`src/generated/prisma` altına üretir. Bu dizin **git'te değildir** — kurulum
yapılmadan `pnpm build` veya `prisma/seed.ts` çalışmaz.

## 2. Veritabanı

```bash
createdb sinavilan
# ya da: psql -U postgres -c "CREATE DATABASE sinavilan;"
```

Windows'ta `psql` PATH'te değilse tam yol:
`"C:\Program Files\PostgreSQL\16\bin\psql"`

## 3. Ortam değişkenleri

`.env.example` dosyasını `.env` olarak kopyala ve doldur:

```bash
cp .env.example .env
```

| Değişken | Zorunlu | Açıklama |
|---|---|---|
| `DATABASE_URL` | evet | `postgresql://postgres:postgres@localhost:5432/sinavilan?schema=public` |
| `AUTH_SECRET` | evet | `openssl rand -base64 32` |
| `AUTH_URL` | evet | Geliştirmede `http://localhost:3000` |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | evet | İlk admin hesabı; seed bunu okur, kodda sabit şifre yoktur |
| `IP_HASH_SALT` | evet | Ham IP saklanmaz, tuzlanmış hash (§7 KVKK) |
| `SMTP_*` | hayır | Boşsa e-posta "yapılandırılmamış" olarak loglanır (§8 Adım 8'de gerekli) |

## 4. Şema ve veri

```bash
pnpm db:migrate     # migration'ları uygula (prisma migrate deploy)
pnpm db:seed        # kurum tipleri, etiketler, 47 kurum, koleksiyonlar, admin
pnpm db:seed-demo   # 66 demo ilan (§8 Adım 3)
```

İkisi de **idempotent** — tekrar çalıştırmak veri çoğaltmaz.

`db:seed-demo` tarihleri **çalıştırıldığı güne göre** üretir: 6 ilan önümüzdeki
7 güne, kalanı ~10 aylık sezona yayılır. Böylece seed ne zaman çalışırsa
çalışsın kayan şerit ve takvim dolu olur.

## 5. Çalıştır

```bash
pnpm dev            # http://localhost:3000
```

Giriş bilgileri `.env`'deki `SEED_ADMIN_*` değerleridir (admin panel §8 Adım 6'da).

## Doğrulama komutları

Commit öncesi dördü de temiz olmalı:

```bash
pnpm lint
pnpm build
pnpm test           # birim testleri (vitest)
pnpm tutarlilik     # §3.9 görsel tutarlılık denetimi
```

`pnpm test:e2e` Playwright içindir; ilk çalıştırmadan önce
`pnpm exec playwright install chromium` gerekir.

## Sorun giderme

**`Cannot find module '@/generated/prisma/client'`**
`pnpm install` çalıştırılmamış ya da `postinstall` atlanmış.
`pnpm exec prisma generate` ile düzelt.

**`SASL: client password must be a string`**
`DATABASE_URL` okunamıyor. `prisma/seed-demo.ts` gibi doğrudan `tsx` ile
çalıştırılan dosyalar `.env`'i kendileri yükler; `.env` dosyasının var
olduğundan emin ol.

**Türkçe sıralama bozuk ("İlyas" yanlış yerde)**
`turkish` collation'ı oluşturulmamış. İlk migration
(`20260730013000_ilk_sema`) bunu yaratır; migration'ların tümünün
uygulandığını `pnpm exec prisma migrate status` ile doğrula.

**Dev sunucusu 500 veriyor, log'da `_buildManifest.js.tmp` ENOENT**
Aynı anda iki dev sunucusu çalışıyor ya da `pnpm build` `.next`'i silmiş.
Port 3000'deki süreçleri kapat, `.next` dizinini sil, yeniden başlat.

**`?tema=v2` önizlemesi çalışmıyor**
Middleware `src/middleware.ts` altında olmalı. `src/app` kullanan projelerde
kök dizindeki `middleware.ts` **sessizce yok sayılır** — hata vermez, sadece
çalışmaz.
