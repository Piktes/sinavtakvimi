-- SINAV İLAN PLATFORMU — ilk şema (§2).
--
-- Prisma'nın üretemediği iki şey bu dosyada elle eklendi:
--   1. Türkçe ICU collation (`Etiket.ad`, `Kurum.ad`, `Ilan.baslik`) — §2
--   2. CHECK kısıtları (sınav bitiş tarihi, abonelik hedef XOR) — §2
-- Prisma'da `@@check` attribute'u yok; Zod katmanı seed/elle SQL ile
-- atlanabildiği için bu kurallar DB düzeyinde de zorunlu.

-- Veritabanı en-US locale ile kurulu olabilir; Türkçe sıralama bu collation
-- olmadan bozuk olur ("İ"/"ı"/"i" sırası). PostgreSQL 16 ICU'yu ek uzantı
-- gerekmeden destekler.
CREATE COLLATION IF NOT EXISTS turkish (provider = icu, locale = 'tr-TR');

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "EtiketTipi" AS ENUM ('GRUP', 'DUZEY', 'FORMAT');

-- CreateEnum
CREATE TYPE "UygulamaTipi" AS ENUM ('TURKIYE_GENELI', 'KURUMSAL');

-- CreateEnum
CREATE TYPE "Zorluk" AS ENUM ('KOLAY', 'ORTA', 'ZOR');

-- CreateEnum
CREATE TYPE "YayinDurumu" AS ENUM ('TASLAK', 'YAYINDA', 'ARSIV');

-- CreateEnum
CREATE TYPE "Gorunum" AS ENUM ('AYLIK', 'LISTE', 'HAFTALIK');

-- CreateEnum
CREATE TYPE "TakvimNotuTipi" AS ENUM ('TATIL', 'BAYRAM', 'SINAV_YOK', 'TAHMINI');

-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('KULLANICI', 'MODERATOR', 'EDITOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "KullaniciDurumu" AS ENUM ('AKTIF', 'ASKIDA', 'SILINDI');

-- CreateEnum
CREATE TYPE "TemaTercihi" AS ENUM ('SISTEM', 'ACIK', 'KOYU');

-- CreateEnum
CREATE TYPE "YorumDurumu" AS ENUM ('BEKLIYOR', 'ONAYLANDI', 'REDDEDILDI', 'SPAM');

-- CreateTable
CREATE TABLE "kurum_tipleri" (
    "id" TEXT NOT NULL,
    "ad" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sira" INTEGER NOT NULL DEFAULT 0,
    "aktif_mi" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "kurum_tipleri_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kurumlar" (
    "id" TEXT NOT NULL,
    "ad" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "tip_id" TEXT NOT NULL,
    "logo_url" TEXT,
    "kapak_url" TEXT,
    "web_sitesi" TEXT,
    "aciklama_md" TEXT,
    "sira" INTEGER NOT NULL DEFAULT 0,
    "aktif_mi" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "kurumlar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "etiketler" (
    "id" TEXT NOT NULL,
    "tip" "EtiketTipi" NOT NULL,
    "ad" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "kisa_ad" TEXT,
    "sira" INTEGER NOT NULL DEFAULT 0,
    "aktif_mi" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "etiketler_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ilanlar" (
    "id" TEXT NOT NULL,
    "baslik" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "seri_no" INTEGER,
    "kurum_id" TEXT NOT NULL,
    "dagitici_kurum_id" TEXT,
    "grup_id" TEXT NOT NULL,
    "format_id" TEXT NOT NULL,
    "sinav_tarihi" DATE NOT NULL,
    "sinav_bitis_tarihi" DATE,
    "saat" TEXT,
    "son_siparis_tarihi" DATE,
    "cevap_anahtari_zamani" TIMESTAMPTZ(6),
    "uygulama_tipi" "UygulamaTipi" NOT NULL,
    "zorluk" "Zorluk",
    "aciklama_md" TEXT,
    "afis_url" TEXT,
    "detay_url" TEXT,
    "sezon" TEXT NOT NULL,
    "one_cikar" BOOLEAN NOT NULL DEFAULT false,
    "yayin_durumu" "YayinDurumu" NOT NULL DEFAULT 'TASLAK',
    "puan_ortalama" DOUBLE PRECISION,
    "puan_sayisi" INTEGER NOT NULL DEFAULT 0,
    "olusturan_id" TEXT,
    "olusturulma" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "guncellenme" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ilanlar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oturumlar" (
    "id" TEXT NOT NULL,
    "ilan_id" TEXT NOT NULL,
    "ad" TEXT NOT NULL,
    "saat" TEXT,
    "sure_dk" INTEGER,
    "soru_sayisi" INTEGER,
    "sira" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "oturumlar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "koleksiyonlar" (
    "id" TEXT NOT NULL,
    "ad" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sira" INTEGER NOT NULL DEFAULT 0,
    "aktif_mi" BOOLEAN NOT NULL DEFAULT true,
    "ikon" TEXT,
    "varsayilan_gorunum" "Gorunum" NOT NULL DEFAULT 'AYLIK',
    "filtre" JSONB NOT NULL,
    "menude_mi" BOOLEAN NOT NULL DEFAULT true,
    "ana_sayfada_mi" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "koleksiyonlar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "takvim_notlari" (
    "id" TEXT NOT NULL,
    "ad" TEXT NOT NULL,
    "baslangic" DATE NOT NULL,
    "bitis" DATE NOT NULL,
    "tip" "TakvimNotuTipi" NOT NULL,
    "aciklama" TEXT,
    "aktif_mi" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "takvim_notlari_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kullanicilar" (
    "id" TEXT NOT NULL,
    "eposta" TEXT NOT NULL,
    "sifre_hash" TEXT NOT NULL,
    "takma_ad" TEXT NOT NULL,
    "eposta_dogrulandi" BOOLEAN NOT NULL DEFAULT false,
    "dogrulama_token" TEXT,
    "yas_beyani_13_ustu" BOOLEAN NOT NULL,
    "duzey_id" TEXT,
    "tema_tercihi" "TemaTercihi" NOT NULL DEFAULT 'SISTEM',
    "rol" "Rol" NOT NULL DEFAULT 'KULLANICI',
    "durum" "KullaniciDurumu" NOT NULL DEFAULT 'AKTIF',
    "sifre_degistirme_zorunlu" BOOLEAN NOT NULL DEFAULT false,
    "olusturulma" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "son_giris" TIMESTAMPTZ(6),

    CONSTRAINT "kullanicilar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "session_token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMPTZ(6) NOT NULL
);

-- CreateTable
CREATE TABLE "abonelikler" (
    "id" TEXT NOT NULL,
    "kullanici_id" TEXT NOT NULL,
    "ilan_id" TEXT,
    "kurum_id" TEXT,
    "koleksiyon_id" TEXT,
    "ofsetler" INTEGER[] DEFAULT ARRAY[3, 1]::INTEGER[],
    "aktif_mi" BOOLEAN NOT NULL DEFAULT true,
    "olusturulma" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "abonelikler_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gonderimler" (
    "id" TEXT NOT NULL,
    "abonelik_id" TEXT NOT NULL,
    "ilan_id" TEXT NOT NULL,
    "ofset" INTEGER NOT NULL,
    "planlanan" TIMESTAMPTZ(6) NOT NULL,
    "gonderilen" TIMESTAMPTZ(6),
    "durum" TEXT NOT NULL DEFAULT 'BEKLIYOR',
    "hata" TEXT,

    CONSTRAINT "gonderimler_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "yorumlar" (
    "id" TEXT NOT NULL,
    "ilan_id" TEXT NOT NULL,
    "kullanici_id" TEXT,
    "puan" INTEGER,
    "icerik" TEXT NOT NULL,
    "durum" "YorumDurumu" NOT NULL DEFAULT 'BEKLIYOR',
    "otomatik_skor" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "moderator_id" TEXT,
    "moderasyon_notu" TEXT,
    "ip_hash" TEXT NOT NULL,
    "olusturulma" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "yorumlar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ayarlar" (
    "anahtar" TEXT NOT NULL,
    "deger" JSONB NOT NULL,
    "grup" TEXT,

    CONSTRAINT "ayarlar_pkey" PRIMARY KEY ("anahtar")
);

-- CreateTable
CREATE TABLE "denetim_kayitlari" (
    "id" TEXT NOT NULL,
    "admin_id" TEXT,
    "eylem" TEXT NOT NULL,
    "varlik" TEXT NOT NULL,
    "varlik_id" TEXT NOT NULL,
    "oncesi" JSONB,
    "sonrasi" JSONB,
    "ip_hash" TEXT,
    "zaman" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "denetim_kayitlari_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_IlanDuzeyleri" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_IlanDuzeyleri_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "kurum_tipleri_slug_key" ON "kurum_tipleri"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "kurumlar_slug_key" ON "kurumlar"("slug");

-- CreateIndex
CREATE INDEX "kurumlar_tip_id_idx" ON "kurumlar"("tip_id");

-- CreateIndex
CREATE INDEX "etiketler_tip_sira_idx" ON "etiketler"("tip", "sira");

-- CreateIndex
CREATE UNIQUE INDEX "etiketler_tip_slug_key" ON "etiketler"("tip", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "ilanlar_slug_key" ON "ilanlar"("slug");

-- CreateIndex
CREATE INDEX "ilanlar_yayin_durumu_sinav_tarihi_idx" ON "ilanlar"("yayin_durumu", "sinav_tarihi");

-- CreateIndex
CREATE INDEX "ilanlar_sezon_sinav_tarihi_idx" ON "ilanlar"("sezon", "sinav_tarihi");

-- CreateIndex
CREATE INDEX "ilanlar_kurum_id_idx" ON "ilanlar"("kurum_id");

-- CreateIndex
CREATE INDEX "ilanlar_grup_id_idx" ON "ilanlar"("grup_id");

-- CreateIndex
CREATE INDEX "ilanlar_format_id_idx" ON "ilanlar"("format_id");

-- CreateIndex
CREATE INDEX "oturumlar_ilan_id_sira_idx" ON "oturumlar"("ilan_id", "sira");

-- CreateIndex
CREATE UNIQUE INDEX "koleksiyonlar_slug_key" ON "koleksiyonlar"("slug");

-- CreateIndex
CREATE INDEX "koleksiyonlar_aktif_mi_sira_idx" ON "koleksiyonlar"("aktif_mi", "sira");

-- CreateIndex
CREATE INDEX "takvim_notlari_baslangic_bitis_idx" ON "takvim_notlari"("baslangic", "bitis");

-- CreateIndex
CREATE UNIQUE INDEX "kullanicilar_eposta_key" ON "kullanicilar"("eposta");

-- CreateIndex
CREATE UNIQUE INDEX "kullanicilar_takma_ad_key" ON "kullanicilar"("takma_ad");

-- CreateIndex
CREATE UNIQUE INDEX "kullanicilar_dogrulama_token_key" ON "kullanicilar"("dogrulama_token");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_provider_account_id_key" ON "accounts"("provider", "provider_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_session_token_key" ON "sessions"("session_token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "abonelikler_kullanici_id_ilan_id_key" ON "abonelikler"("kullanici_id", "ilan_id");

-- CreateIndex
CREATE UNIQUE INDEX "abonelikler_kullanici_id_kurum_id_key" ON "abonelikler"("kullanici_id", "kurum_id");

-- CreateIndex
CREATE UNIQUE INDEX "abonelikler_kullanici_id_koleksiyon_id_key" ON "abonelikler"("kullanici_id", "koleksiyon_id");

-- CreateIndex
CREATE INDEX "gonderimler_durum_planlanan_idx" ON "gonderimler"("durum", "planlanan");

-- CreateIndex
CREATE UNIQUE INDEX "gonderimler_abonelik_id_ilan_id_ofset_key" ON "gonderimler"("abonelik_id", "ilan_id", "ofset");

-- CreateIndex
CREATE INDEX "yorumlar_durum_olusturulma_idx" ON "yorumlar"("durum", "olusturulma");

-- CreateIndex
CREATE UNIQUE INDEX "yorumlar_ilan_id_kullanici_id_key" ON "yorumlar"("ilan_id", "kullanici_id");

-- CreateIndex
CREATE INDEX "denetim_kayitlari_zaman_idx" ON "denetim_kayitlari"("zaman");

-- CreateIndex
CREATE INDEX "_IlanDuzeyleri_B_index" ON "_IlanDuzeyleri"("B");

-- AddForeignKey
ALTER TABLE "kurumlar" ADD CONSTRAINT "kurumlar_tip_id_fkey" FOREIGN KEY ("tip_id") REFERENCES "kurum_tipleri"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ilanlar" ADD CONSTRAINT "ilanlar_kurum_id_fkey" FOREIGN KEY ("kurum_id") REFERENCES "kurumlar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ilanlar" ADD CONSTRAINT "ilanlar_dagitici_kurum_id_fkey" FOREIGN KEY ("dagitici_kurum_id") REFERENCES "kurumlar"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ilanlar" ADD CONSTRAINT "ilanlar_grup_id_fkey" FOREIGN KEY ("grup_id") REFERENCES "etiketler"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ilanlar" ADD CONSTRAINT "ilanlar_format_id_fkey" FOREIGN KEY ("format_id") REFERENCES "etiketler"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ilanlar" ADD CONSTRAINT "ilanlar_olusturan_id_fkey" FOREIGN KEY ("olusturan_id") REFERENCES "kullanicilar"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oturumlar" ADD CONSTRAINT "oturumlar_ilan_id_fkey" FOREIGN KEY ("ilan_id") REFERENCES "ilanlar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kullanicilar" ADD CONSTRAINT "kullanicilar_duzey_id_fkey" FOREIGN KEY ("duzey_id") REFERENCES "etiketler"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "kullanicilar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "kullanicilar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "abonelikler" ADD CONSTRAINT "abonelikler_kullanici_id_fkey" FOREIGN KEY ("kullanici_id") REFERENCES "kullanicilar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "abonelikler" ADD CONSTRAINT "abonelikler_ilan_id_fkey" FOREIGN KEY ("ilan_id") REFERENCES "ilanlar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "abonelikler" ADD CONSTRAINT "abonelikler_kurum_id_fkey" FOREIGN KEY ("kurum_id") REFERENCES "kurumlar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "abonelikler" ADD CONSTRAINT "abonelikler_koleksiyon_id_fkey" FOREIGN KEY ("koleksiyon_id") REFERENCES "koleksiyonlar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gonderimler" ADD CONSTRAINT "gonderimler_abonelik_id_fkey" FOREIGN KEY ("abonelik_id") REFERENCES "abonelikler"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yorumlar" ADD CONSTRAINT "yorumlar_ilan_id_fkey" FOREIGN KEY ("ilan_id") REFERENCES "ilanlar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yorumlar" ADD CONSTRAINT "yorumlar_kullanici_id_fkey" FOREIGN KEY ("kullanici_id") REFERENCES "kullanicilar"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yorumlar" ADD CONSTRAINT "yorumlar_moderator_id_fkey" FOREIGN KEY ("moderator_id") REFERENCES "kullanicilar"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "denetim_kayitlari" ADD CONSTRAINT "denetim_kayitlari_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "kullanicilar"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_IlanDuzeyleri" ADD CONSTRAINT "_IlanDuzeyleri_A_fkey" FOREIGN KEY ("A") REFERENCES "etiketler"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_IlanDuzeyleri" ADD CONSTRAINT "_IlanDuzeyleri_B_fkey" FOREIGN KEY ("B") REFERENCES "ilanlar"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- ---------------------------------------------------------------------------
-- Türkçe collation — kullanıcıya görünen ve sıralanan metin sütunları (§2).
-- ---------------------------------------------------------------------------
ALTER TABLE "etiketler" ALTER COLUMN "ad" TYPE TEXT COLLATE "turkish";
ALTER TABLE "kurumlar" ALTER COLUMN "ad" TYPE TEXT COLLATE "turkish";
ALTER TABLE "ilanlar" ALTER COLUMN "baslik" TYPE TEXT COLLATE "turkish";
ALTER TABLE "kurum_tipleri" ALTER COLUMN "ad" TYPE TEXT COLLATE "turkish";
ALTER TABLE "koleksiyonlar" ALTER COLUMN "ad" TYPE TEXT COLLATE "turkish";
ALTER TABLE "takvim_notlari" ALTER COLUMN "ad" TYPE TEXT COLLATE "turkish";

-- ---------------------------------------------------------------------------
-- CHECK kısıtları (§2).
-- ---------------------------------------------------------------------------

-- "9–12 Ekim 2026" gibi aralıklar: bitiş doluysa başlangıçtan sonra olmalı.
ALTER TABLE "ilanlar"
  ADD CONSTRAINT "ilanlar_bitis_sinavdan_sonra"
  CHECK ("sinav_bitis_tarihi" IS NULL OR "sinav_bitis_tarihi" > "sinav_tarihi");

-- Bildirim aboneliği: ilan / kurum / koleksiyon hedeflerinden TAM BİRİ dolu.
ALTER TABLE "abonelikler"
  ADD CONSTRAINT "abonelikler_hedef_xor"
  CHECK (num_nonnulls("ilan_id", "kurum_id", "koleksiyon_id") = 1);

-- Yorum puanı 1–5 aralığında (§4.9).
ALTER TABLE "yorumlar"
  ADD CONSTRAINT "yorumlar_puan_araligi"
  CHECK ("puan" IS NULL OR ("puan" >= 1 AND "puan" <= 5));
