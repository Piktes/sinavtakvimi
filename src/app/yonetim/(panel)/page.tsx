import Link from "next/link";
import { PANEL_ROLLERI } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { Card, CardGovde } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { requireRol } from "@/lib/rbac";
import { formatTarih, formatTarihSaat } from "@/lib/tarih";

// §6 Gösterge paneli: bugünün sayıları, onay bekleyen yorum, yaklaşan 7 gün,
// son işlemler. Ziyaretçi/kayıt metrikleri analitik katmanıyla (Adım 10) gelir.
export default async function GostergePaneli() {
  const oturum = await requireRol(PANEL_ROLLERI);

  const bugun = new Date();
  bugun.setUTCHours(0, 0, 0, 0);
  const yediGunSonra = new Date(bugun);
  yediGunSonra.setUTCDate(yediGunSonra.getUTCDate() + 7);

  const [yayindaSayisi, taslakSayisi, bekleyenYorum, yaklasanlar, sonIslemler] = await Promise.all([
    prisma.ilan.count({ where: { yayinDurumu: "YAYINDA" } }),
    prisma.ilan.count({ where: { yayinDurumu: "TASLAK" } }),
    prisma.yorum.count({ where: { durum: "BEKLIYOR" } }),
    prisma.ilan.findMany({
      where: { yayinDurumu: "YAYINDA", sinavTarihi: { gte: bugun, lte: yediGunSonra } },
      select: {
        id: true,
        baslik: true,
        slug: true,
        sinavTarihi: true,
        kurum: { select: { ad: true } },
      },
      orderBy: { sinavTarihi: "asc" },
    }),
    prisma.denetimKaydi.findMany({
      select: {
        id: true,
        eylem: true,
        varlik: true,
        zaman: true,
        admin: { select: { takmaAd: true } },
      },
      orderBy: { zaman: "desc" },
      take: 8,
    }),
  ]);

  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-baslik text-2xl font-semibold text-text">Gösterge paneli</h1>

      <div className="grid gap-3 sm:grid-cols-3">
        <Sayac etiket="Yayında ilan" deger={yayindaSayisi} />
        <Sayac etiket="Taslak ilan" deger={taslakSayisi} />
        <Sayac
          etiket="Onay bekleyen yorum"
          deger={bekleyenYorum}
          uyari={bekleyenYorum > 0}
          // §9 moderasyon ekranı Adım 9'da; şimdilik yalnızca sayaç.
        />
      </div>

      <section className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <h2 className="font-baslik text-lg font-semibold text-text">Yaklaşan 7 gün</h2>
          {oturum.rol !== "MODERATOR" && (
            <Link href="/yonetim/ilanlar" className="text-sm text-text-muted hover:underline">
              Tüm ilanlar →
            </Link>
          )}
        </div>

        {yaklasanlar.length === 0 ? (
          <p className="text-sm text-text-muted">Önümüzdeki 7 günde yayında ilan yok.</p>
        ) : (
          <Card>
            <ul className="divide-y divide-border">
              {yaklasanlar.map((ilan) => (
                <li key={ilan.id} className="flex items-center gap-3 p-3">
                  <span className="sayisal w-28 shrink-0 text-sm text-text-muted">
                    {formatTarih(ilan.sinavTarihi)}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-text">{ilan.baslik}</span>
                  <span className="shrink-0 text-sm text-text-muted">{ilan.kurum.ad}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-baslik text-lg font-semibold text-text">Son işlemler</h2>
        {sonIslemler.length === 0 ? (
          <p className="text-sm text-text-muted">Henüz kayıt yok.</p>
        ) : (
          <Card>
            <ul className="divide-y divide-border">
              {sonIslemler.map((kayit) => (
                <li key={kayit.id} className="flex items-center gap-3 p-3 text-sm">
                  <span className="sayisal w-40 shrink-0 text-text-muted">
                    {formatTarihSaat(kayit.zaman)}
                  </span>
                  <Badge varyant="notr">{kayit.eylem}</Badge>
                  <span className="text-text">{kayit.varlik}</span>
                  <span className="ml-auto text-text-muted">{kayit.admin?.takmaAd ?? "—"}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </section>
    </div>
  );
}

function Sayac({
  etiket,
  deger,
  uyari = false,
}: {
  etiket: string;
  deger: number;
  uyari?: boolean;
}) {
  return (
    <Card>
      <CardGovde className="flex flex-col gap-1 p-4">
        <span className="text-sm text-text-muted">{etiket}</span>
        <span className="sayisal text-2xl font-semibold text-text">{deger}</span>
        {uyari && <Badge varyant="uyari">İşlem bekliyor</Badge>}
      </CardGovde>
    </Card>
  );
}
