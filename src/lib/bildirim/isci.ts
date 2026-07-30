import "server-only";
import { PgBoss } from "pg-boss";
import { askidaKalanlariKurtar, bekleyenleriGonder } from "@/lib/bildirim/gonderici";
import { gunuPlanla } from "@/lib/bildirim/planlayici";

// §4.8: "pg-boss günlük planlayıcı (06:00), gönderim 08:00 ±15 dk rastgele."
//
// İki ayrı iş:
//   gunluk-planlama  — 06:00'da bir kez, o günün Gonderim satırlarını yazar
//   gonderim-turu    — 5 dakikada bir, planlanan <= şimdi olanları yollar
//
// Gönderimi cron'la 08:00'e sabitlemek yerine sık turlarla yapmak, ±15 dk
// saçılmayı satırın kendi `planlanan` alanına bırakıyor: iş kuyruğu basit
// kalıyor ve yeniden deneme kendiliğinden çalışıyor.

export const ISLER = {
  planlama: "gunluk-planlama",
  gonderim: "gonderim-turu",
} as const;

// pg-boss kendi şemasını kurar; uygulama şemasıyla karışmasın diye ayrı.
const SEMA = "pgboss";

let boss: PgBoss | null = null;

export async function bossAl(): Promise<PgBoss> {
  if (boss) return boss;

  const baglanti = process.env.DATABASE_URL;
  if (!baglanti) throw new Error("DATABASE_URL tanımlı değil — pg-boss başlatılamaz.");

  boss = new PgBoss({ connectionString: baglanti, schema: SEMA });
  boss.on("error", (hata: unknown) => console.error("[pg-boss]", hata));
  await boss.start();
  return boss;
}

export async function isleriKur(): Promise<void> {
  const b = await bossAl();

  await b.createQueue(ISLER.planlama);
  await b.createQueue(ISLER.gonderim);

  // Europe/Istanbul: pg-boss cron'u UTC yorumlar, 06:00 İstanbul = 03:00 UTC.
  await b.schedule(ISLER.planlama, "0 3 * * *", undefined, { tz: "UTC" });
  await b.schedule(ISLER.gonderim, "*/5 * * * *", undefined, { tz: "UTC" });

  await b.work(ISLER.planlama, async () => {
    const kurtarilan = await askidaKalanlariKurtar();
    const sonuc = await gunuPlanla();
    console.log(
      `[planlama] ${sonuc.gun}: ${sonuc.incelenenAbonelik} abonelik → ` +
        `${sonuc.olusturulanGonderim} yeni, ${sonuc.atlananGonderim} zaten vardı, ` +
        `${sonuc.tekillestirilen} tekilleştirildi` +
        (kurtarilan ? `, ${kurtarilan} askıda kalan kurtarıldı` : ""),
    );
  });

  await b.work(ISLER.gonderim, async () => {
    const sonuc = await bekleyenleriGonder();
    if (sonuc.sahiplenilen > 0) {
      console.log(
        `[gönderim] ${sonuc.sahiplenilen} sahiplenildi → ` +
          `${sonuc.gonderilen} gönderildi, ${sonuc.basarisiz} yeniden denenecek, ` +
          `${sonuc.yapilandirilmamis} SMTP yok`,
      );
    }
  });
}

export async function bossuDurdur(): Promise<void> {
  if (!boss) return;
  await boss.stop({ graceful: true });
  boss = null;
}
