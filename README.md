# Sınav İlan Platformu

Yayınevleri ve eğitim kurumlarının deneme sınavı ilanlarını yayınladığı,
öğrencilerin bu ilanları takvim üzerinde takip ettiği, bildirim aldığı ve
yorumladığı bir platform.

## Belgeler

| Dosya                                                          | İçerik                                     |
| -------------------------------------------------------------- | ------------------------------------------ |
| [`docs/SINAV-ILAN-PLATFORMU.md`](docs/SINAV-ILAN-PLATFORMU.md) | Ürün şartnamesi                            |
| [`KURULUM.md`](KURULUM.md)                                     | Yeni makinede kurulum                      |
| [`DURUM.md`](DURUM.md)                                         | Yapılanlar, yol haritası, bilinen tuzaklar |
| [`CLAUDE.md`](CLAUDE.md)                                       | Geliştirme kuralları ve mimari özeti       |

## Hızlı başlangıç

```bash
pnpm install
cp .env.example .env          # DATABASE_URL ve AUTH_SECRET doldur
createdb sinavilan
pnpm db:migrate
pnpm db:seed
pnpm db:seed-demo
pnpm dev                      # http://localhost:3000
```

Ayrıntı ve sorun giderme için [`KURULUM.md`](KURULUM.md).

## Durum

Şartname §8'deki yapım sırasına göre **Adım 1–7 tamamlandı**: şema/migration/
seed, görsel token katmanı, demo veri, V1 genel site (takvim, filtreler, ilan
detay, yayınevi sayfası), üç versiyon (V1 Ajanda · V2 Vitrin · V3 Akış) ve
admin paneli (giriş, RBAC, ilan CRUD, önizleme, toplu seri girişi, kurumlar,
etiketler, canlı önizlemeli koleksiyon filtre kurucusu, takvim notları).

Sırada **Adım 8**: üyelik ve dört seviyeli bildirim sistemi.
Ayrıntı [`DURUM.md`](DURUM.md).

## Yığın

Next.js 15 (App Router) · TypeScript · Tailwind v4 · Prisma 7 + PostgreSQL 16 ·
Auth.js v5 · Zod · Motion · Lucide · pg-boss · Nodemailer
