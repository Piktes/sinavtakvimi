import type { Metadata } from "next";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { formatTarihSaat } from "@/lib/tarih";
import { prisma } from "@/lib/prisma";
import { requireRol } from "@/lib/rbac";
import { ModerasyonKuyrugu, type KuyrukYorumu } from "./moderasyon-kuyrugu";

export const metadata: Metadata = { title: "Yorum moderasyonu" };
export const dynamic = "force-dynamic";

const MODERASYON_ROLLERI = ["ADMIN", "MODERATOR"] as const;

const SEKMELER = [
  { anahtar: "BEKLIYOR", etiket: "Bekleyenler" },
  { anahtar: "ONAYLANDI", etiket: "Onaylananlar" },
  { anahtar: "REDDEDILDI", etiket: "Reddedilenler" },
  { anahtar: "SPAM", etiket: "Spam" },
] as const;

type Durum = (typeof SEKMELER)[number]["anahtar"];

export default async function YorumModerasyonuSayfasi({
  searchParams,
}: {
  searchParams: Promise<{ durum?: string }>;
}) {
  await requireRol(MODERASYON_ROLLERI);

  const { durum } = await searchParams;
  const aktifDurum: Durum = SEKMELER.some((s) => s.anahtar === durum)
    ? (durum as Durum)
    : "BEKLIYOR";

  const [satirlar, sayilar] = await Promise.all([
    prisma.yorum.findMany({
      where: { durum: aktifDurum },
      // §6: filtre skoru yüksek olanlar önce — moderatörün dikkatini
      // gerektiren içerik kuyruğun başında olsun.
      orderBy: [{ otomatikSkor: "desc" }, { olusturulma: "asc" }],
      take: 100,
      select: {
        id: true,
        puan: true,
        icerik: true,
        durum: true,
        otomatikSkor: true,
        moderasyonNotu: true,
        olusturulma: true,
        kullanici: { select: { takmaAd: true } },
        ilan: { select: { baslik: true, slug: true } },
      },
    }),
    prisma.yorum.groupBy({ by: ["durum"], _count: { _all: true } }),
  ]);

  const sayiHaritasi = new Map(sayilar.map((s) => [s.durum, s._count._all]));

  const yorumlar: KuyrukYorumu[] = satirlar.map((satir) => ({
    id: satir.id,
    puan: satir.puan,
    icerik: satir.icerik,
    durum: satir.durum,
    otomatikSkor: satir.otomatikSkor,
    moderasyonNotu: satir.moderasyonNotu,
    // §3.7: tarih biçimlendirme yalnızca lib/tarih.ts'ten; istemci
    // bileşenine hazır metin gidiyor.
    olusturulmaMetni: formatTarihSaat(satir.olusturulma),
    takmaAd: satir.kullanici?.takmaAd ?? null,
    ilan: satir.ilan,
  }));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="font-baslik text-2xl font-semibold text-text">Yorum moderasyonu</h1>
        <p className="text-sm text-text-muted">
          Onaylanmayan yorum sitede görünmez ve puan ortalamasına girmez.
        </p>
      </div>

      <nav className="flex flex-wrap gap-1 border-b border-border">
        {SEKMELER.map((sekme) => {
          const aktif = sekme.anahtar === aktifDurum;
          const sayi = sayiHaritasi.get(sekme.anahtar) ?? 0;
          return (
            <Link
              key={sekme.anahtar}
              href={`/yonetim/yorumlar?durum=${sekme.anahtar}`}
              aria-current={aktif ? "page" : undefined}
              className={cn(
                "-mb-px border-b-2 px-3 py-2 text-sm transition-colors",
                aktif
                  ? "border-primary font-medium text-text"
                  : "border-transparent text-text-muted hover:text-text",
              )}
            >
              {sekme.etiket}
              <span className="sayisal ml-1.5 text-xs text-text-faint">{sayi}</span>
            </Link>
          );
        })}
      </nav>

      <ModerasyonKuyrugu key={aktifDurum} yorumlar={yorumlar} />
    </div>
  );
}
