// Tek seferlik/yardımcı script — resmi seed-demo.ts'in bir parçası DEĞİL.
// Amaç: yeni eklenen 13 gerçek logolu kurumun (henüz hiç ilanı olmayan)
// ana sayfada/takvimde görünmesi için birer görsel doğrulama ilanı açmak.
// Idempotent: slug üzerinden upsert, tekrar çalıştırmak çoğaltmaz.
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.ts";
import { sezonTuret } from "../src/lib/sezon.ts";
import { slugla } from "../src/lib/slug.ts";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const KURUMLAR = [
  "Orbital",
  "Krallar Karması",
  "Hız ve Renk",
  "eduShare",
  "İlyas Güneş",
  "Biyotik",
  "Orijinal",
  "Ulti",
  "Acil",
  "Branşlar Karması",
  "Aktif Öğrenme Prime",
  "İşler Kitabevleri",
  "Çap",
];

function gunEkle(temel: Date, gun: number): Date {
  const d = new Date(temel);
  d.setUTCDate(d.getUTCDate() + gun);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

async function main() {
  const bugun = new Date();
  bugun.setUTCHours(0, 0, 0, 0);

  const grup = await prisma.etiket.findFirstOrThrow({ where: { tip: "GRUP", ad: "YKS" } });
  const format = await prisma.etiket.findFirstOrThrow({ where: { tip: "FORMAT", ad: "TYT" } });
  const duzey = await prisma.etiket.findFirstOrThrow({ where: { tip: "DUZEY", ad: "12. Sınıf" } });

  let sayac = 0;
  for (const [index, ad] of KURUMLAR.entries()) {
    const kurum = await prisma.kurum.findFirstOrThrow({ where: { ad } });
    const sinavTarihi = gunEkle(bugun, 10 + index * 7);
    const baslik = `${ad} TYT Denemesi 01`;
    const slug = slugla(`${baslik}-${sezonTuret(sinavTarihi)}`);

    await prisma.ilan.upsert({
      where: { slug },
      update: {},
      create: {
        baslik,
        slug,
        seriNo: 1,
        kurumId: kurum.id,
        grupId: grup.id,
        formatId: format.id,
        sinavTarihi,
        sonSiparisTarihi: gunEkle(sinavTarihi, -14),
        uygulamaTipi: "TURKIYE_GENELI",
        zorluk: "ORTA",
        sezon: sezonTuret(sinavTarihi),
        yayinDurumu: "YAYINDA",
        duzeyler: { connect: { id: duzey.id } },
      },
    });
    sayac += 1;
  }

  console.log(`${sayac} logo-doğrulama ilanı upsert edildi.`);
}

main()
  .catch((hata) => {
    console.error(hata);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
