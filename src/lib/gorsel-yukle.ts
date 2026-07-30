import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

// §7 güvenlik: "Yükleme: MIME doğrulama, boyut sınırı, yeniden kodlama,
// EXIF temizliği."
//
// sharp ile yeniden kodlama EXIF'i (konum verisi dahil) düşürür —
// `.withMetadata()` çağrılmadığı sürece hiçbir metadata çıktıya taşınmaz.
// Bu yüzden "yeniden kodlama" ve "EXIF temizliği" tek işlemde çözülüyor.

const IZINLI_TIPLER = ["image/png", "image/jpeg", "image/webp"];
const MAKS_BAYT = 2 * 1024 * 1024; // 2 MB

export interface YuklemeSecenekleri {
  klasor: string;
  genislik: number;
  yukseklik: number;
}

export async function gorselYukle(
  dosya: File,
  dosyaOnEki: string,
  secenekler: YuklemeSecenekleri,
): Promise<string> {
  if (!IZINLI_TIPLER.includes(dosya.type)) {
    throw new Error("Desteklenmeyen dosya türü. PNG, JPEG veya WEBP yükleyin.");
  }
  if (dosya.size > MAKS_BAYT) {
    throw new Error("Dosya 2 MB'tan büyük olamaz.");
  }

  const arabellek = Buffer.from(await dosya.arrayBuffer());

  // Yeniden kodlama: hem EXIF'i düşürür hem de gelen dosyanın gerçekten
  // görsel olduğunu doğrular (bozuk/sahte dosyada sharp hata verir).
  const cikti = await sharp(arabellek)
    .resize(secenekler.genislik, secenekler.yukseklik, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 85 })
    .toBuffer();

  const dosyaAdi = `${dosyaOnEki}-${Date.now()}.webp`;
  const hedefDizin = path.join(process.cwd(), "public", "uploads", secenekler.klasor);
  await mkdir(hedefDizin, { recursive: true });
  await writeFile(path.join(hedefDizin, dosyaAdi), cikti);

  return `/uploads/${secenekler.klasor}/${dosyaAdi}`;
}
