// Planlamayı elle tetikler (işçiyi beklemeden test etmek için):
//   pnpm bildirim:planla            → bugünü planla
//   pnpm bildirim:planla --gonder   → planla + bekleyenleri hemen yolla
// Next.js dışında çalışıyoruz; .env'i kendimiz yüklüyoruz. Bu satır İLK
// import olmalı: ESM tüm import'ları gövdeden önce değerlendirir, dolayısıyla
// `config()` çağrısı olarak yazılsaydı prisma modülü DATABASE_URL'siz
// başlatılırdı.
import "dotenv/config";
import { bekleyenleriGonder } from "@/lib/bildirim/gonderici";
import { gunuPlanla } from "@/lib/bildirim/planlayici";

async function main() {
  const sonuc = await gunuPlanla();
  console.log(
    `[planlama] ${sonuc.gun}: ${sonuc.incelenenAbonelik} abonelik → ` +
      `${sonuc.olusturulanGonderim} yeni, ${sonuc.atlananGonderim} zaten vardı, ` +
      `${sonuc.tekillestirilen} tekilleştirildi`,
  );

  if (process.argv.includes("--gonder")) {
    // Planlanan an geleceğe düşse bile hepsini yollamak için ileri bir an.
    const ileri = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const gonderim = await bekleyenleriGonder(ileri);
    console.log(
      `[gönderim] ${gonderim.sahiplenilen} sahiplenildi → ${gonderim.gonderilen} gönderildi, ` +
        `${gonderim.basarisiz} başarısız, ${gonderim.yapilandirilmamis} SMTP yok`,
    );
  }
}

main()
  .then(() => process.exit(0))
  .catch((hata) => {
    console.error(hata);
    process.exit(1);
  });
