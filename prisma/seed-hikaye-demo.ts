// Tek seferlik/yardımcı script — resmi seed'in parçası DEĞİL.
// Ana sayfadaki hikaye şeridini gerçekçi duyurularla doldurur. Görseller
// public/uploads/hikaye-demo altındadır (sınav temalı zemin + yayınevinin
// gerçek logosu) ve depoya dahildir; admin panelden yüklenen hikayeler ise
// `hikayeler/` klasörüne gider ve depoya girmez (bkz. .gitignore).
// Idempotent: aynı başlık varsa günceller, yoksa oluşturur.
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.ts";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const HIKAYELER = [
  {
    baslik: "Özdebir TYT-AYT",
    gorselUrl: "/uploads/hikaye-demo/hikaye-ozdebir.webp",
    baglanti: "/yayinevi/ozdebir",
    sira: 0,
  },
  {
    baslik: "Paraf TYT",
    gorselUrl: "/uploads/hikaye-demo/hikaye-paraf.webp",
    baglanti: "/yayinevi/paraf",
    sira: 1,
  },
  {
    baslik: "Mikro Orijinal",
    gorselUrl: "/uploads/hikaye-demo/hikaye-mikro.webp",
    baglanti: "/yayinevi/mikro-orijinal",
    sira: 2,
  },
  {
    baslik: "Bilgi Sarmal AYT",
    gorselUrl: "/uploads/hikaye-demo/hikaye-bilgi-sarmal.webp",
    baglanti: "/yayinevi/bilgi-sarmal",
    sira: 3,
  },
  {
    baslik: "Apotemi Branş",
    gorselUrl: "/uploads/hikaye-demo/hikaye-apotemi.webp",
    baglanti: "/yayinevi/apotemi",
    sira: 4,
  },
  {
    baslik: "Çözüm Gelişim İzleme",
    gorselUrl: "/uploads/hikaye-demo/hikaye-cozum.webp",
    baglanti: "/yayinevi/cozum-egitim-kurumlari",
    sira: 5,
  },
];

async function main() {
  // Önceki elle eklenen test hikayeleri (logo dosyasını hikaye görseli olarak
  // kullanıyorlardı) temizlensin.
  const silinen = await prisma.hikaye.deleteMany({
    where: { baslik: { in: ["Yeni sezon başladı", "Bilgi Sarmal duyurdu"] } },
  });

  for (const hikaye of HIKAYELER) {
    const mevcut = await prisma.hikaye.findFirst({ where: { baslik: hikaye.baslik } });
    if (mevcut) {
      await prisma.hikaye.update({ where: { id: mevcut.id }, data: hikaye });
    } else {
      await prisma.hikaye.create({ data: hikaye });
    }
  }

  console.log(`${silinen.count} test hikayesi silindi, ${HIKAYELER.length} hikaye yazıldı.`);
}

main()
  .catch((hata) => {
    console.error(hata);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
