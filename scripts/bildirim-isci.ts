// §4.8 bildirim işçisi. Web sunucusundan AYRI süreç olarak çalışır:
//   pnpm worker
//
// Next.js süreci içinde başlatılmıyor çünkü dev'de her yeniden derlemede
// zamanlayıcı yeniden kurulur, üretimde de birden çok sunucu örneği aynı
// cron'u çalıştırırdı. Ayrı süreç tek planlayıcı garantisi verir.
// Next.js dışında çalışıyoruz; .env'i kendimiz yüklüyoruz. Bu satır İLK
// import olmalı: ESM tüm import'ları gövdeden önce değerlendirir, dolayısıyla
// `config()` çağrısı olarak yazılsaydı prisma modülü DATABASE_URL'siz
// başlatılırdı.
import "dotenv/config";
import { bossuDurdur, isleriKur } from "@/lib/bildirim/isci";

async function main() {
  await isleriKur();
  console.log("[işçi] hazır — planlama 06:00 (Europe/Istanbul), gönderim turu 5 dk");
}

for (const sinyal of ["SIGINT", "SIGTERM"] as const) {
  process.on(sinyal, async () => {
    console.log(`\n[işçi] ${sinyal} — kapanıyor`);
    await bossuDurdur();
    process.exit(0);
  });
}

main().catch((hata) => {
  console.error("[işçi] başlatılamadı:", hata);
  process.exit(1);
});
