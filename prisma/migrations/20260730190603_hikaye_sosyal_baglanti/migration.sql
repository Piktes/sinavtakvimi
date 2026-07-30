-- CreateTable
CREATE TABLE "hikayeler" (
    "id" TEXT NOT NULL,
    "baslik" TEXT NOT NULL,
    "gorsel_url" TEXT NOT NULL,
    "baglanti" TEXT,
    "sira" INTEGER NOT NULL DEFAULT 0,
    "aktif_mi" BOOLEAN NOT NULL DEFAULT true,
    "olusturulma" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hikayeler_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sosyal_baglantilar" (
    "id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sira" INTEGER NOT NULL DEFAULT 0,
    "aktif_mi" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "sosyal_baglantilar_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "hikayeler_aktif_mi_sira_idx" ON "hikayeler"("aktif_mi", "sira");

-- CreateIndex
CREATE UNIQUE INDEX "sosyal_baglantilar_platform_key" ON "sosyal_baglantilar"("platform");
