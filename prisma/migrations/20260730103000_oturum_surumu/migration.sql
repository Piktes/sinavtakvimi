-- Oturum sürümü: JWT'ye gömülür, her korumalı istekte DB'dekiyle karşılaştırılır.
-- Şifre değişiminde artırılır → dağıtılmış tüm token'lar anında geçersizleşir.
-- Credentials sağlayıcısı database session'a izin vermediği için (Auth.js'in
-- belgelenmiş kısıtı) iptal mekanizması bu alanla sağlanıyor; bkz. DURUM.md.
ALTER TABLE "kullanicilar" ADD COLUMN "oturum_surumu" INTEGER NOT NULL DEFAULT 1;
