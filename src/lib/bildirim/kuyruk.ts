import "server-only";
import { PgBoss } from "pg-boss";

// Web sürecinden kuyruğa iş ATMAK için ince bir sarmalayıcı.
//
// `isci.ts` işleri KURAR ve TÜKETİR; burası yalnızca gönderir. Ayrı dosya
// olmasının nedeni: isci.ts'i import etmek planlayıcıyı ve göndericiyi de
// web paketine sokardı.
//
// İşçi çalışmıyorsa iş kuyrukta bekler — kaybolmaz. §4.8'in "kritik bilgi"
// dediği tarih değişikliği bildirimini admin'in kaydet isteğinde SMTP'ye
// bağlamamak için kuyruk kullanılıyor.

export const TARIH_DEGISTI_ISI = "tarih-degisti";

export interface TarihDegistiYuku {
  ilanId: string;
  eskiTarih: string;
  yeniTarih: string;
}

let boss: PgBoss | null = null;

async function gonderenBoss(): Promise<PgBoss | null> {
  if (boss) return boss;

  const baglanti = process.env.DATABASE_URL;
  if (!baglanti) return null;

  const yeni = new PgBoss({ connectionString: baglanti, schema: "pgboss" });
  yeni.on("error", (hata: unknown) => console.error("[kuyruk]", hata));
  await yeni.start();
  await yeni.createQueue(TARIH_DEGISTI_ISI);
  boss = yeni;
  return boss;
}

/**
 * Tarih değişikliği bildirimini kuyruğa alır.
 *
 * Kuyruk erişilemezse HATA FIRLATMAZ: admin'in ilan kaydı, bildirim
 * altyapısı yüzünden başarısız olmamalı. Bunun karşılığında bildirimin
 * kaybolabileceği kabul ediliyor; konsola düşüyor ki sessiz kalmasın.
 */
export async function tarihDegisikligiSiraya(yuk: TarihDegistiYuku): Promise<boolean> {
  try {
    const b = await gonderenBoss();
    if (!b) {
      console.warn("[kuyruk] DATABASE_URL yok — tarih değişikliği bildirimi atlandı", yuk);
      return false;
    }
    await b.send(TARIH_DEGISTI_ISI, yuk);
    return true;
  } catch (hata) {
    console.error("[kuyruk] tarih değişikliği bildirimi sıraya alınamadı:", hata, yuk);
    return false;
  }
}
