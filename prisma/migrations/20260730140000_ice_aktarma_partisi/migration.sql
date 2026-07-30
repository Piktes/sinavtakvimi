-- §4.2: "ImportBatch sayesinde hatalı yükleme tek işlemle geri alınır."
-- Hangi ilanın hangi yüklemeden geldiği kaydedilmeden toplu geri alma
-- yapılamıyor; bu yüzden parti tablosu ve ilanlarda parti bağlantısı.

CREATE TYPE "IceAktarmaDurumu" AS ENUM ('TAMAMLANDI', 'GERI_ALINDI');

CREATE TABLE "ice_aktarma_partileri" (
    "id" TEXT NOT NULL,
    "dosya_adi" TEXT NOT NULL,
    "admin_id" TEXT,
    "satir_sayisi" INTEGER NOT NULL,
    "basarili" INTEGER NOT NULL,
    "hatali" INTEGER NOT NULL,
    "durum" "IceAktarmaDurumu" NOT NULL DEFAULT 'TAMAMLANDI',
    "hata_raporu" JSONB,
    "zaman" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "geri_alindi" TIMESTAMPTZ(6),

    CONSTRAINT "ice_aktarma_partileri_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ice_aktarma_partileri_zaman_idx" ON "ice_aktarma_partileri"("zaman");

ALTER TABLE "ice_aktarma_partileri"
  ADD CONSTRAINT "ice_aktarma_partileri_admin_id_fkey"
  FOREIGN KEY ("admin_id") REFERENCES "kullanicilar"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ilanlar" ADD COLUMN "ice_aktarma_partisi_id" TEXT;

CREATE INDEX "ilanlar_ice_aktarma_partisi_id_idx" ON "ilanlar"("ice_aktarma_partisi_id");

-- Parti silinirse ilan silinmez, yalnızca bağı kopar (geri alma partiyi
-- silmiyor; kayıt izlenebilirlik için kalıyor).
ALTER TABLE "ilanlar"
  ADD CONSTRAINT "ilanlar_ice_aktarma_partisi_id_fkey"
  FOREIGN KEY ("ice_aktarma_partisi_id") REFERENCES "ice_aktarma_partileri"("id") ON DELETE SET NULL ON UPDATE CASCADE;
