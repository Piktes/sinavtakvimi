import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { kurumRengi } from "@/lib/kurum-tonu";
import { prisma } from "@/lib/prisma";
import { requireRol } from "@/lib/rbac";
import { KurumSilButonu } from "./sil-butonu";

export default async function KurumlarSayfasi() {
  await requireRol(["ADMIN", "EDITOR"]);

  const kurumlar = await prisma.kurum.findMany({
    select: {
      id: true,
      ad: true,
      slug: true,
      logoUrl: true,
      sira: true,
      aktifMi: true,
      tip: { select: { ad: true } },
      _count: { select: { ilanlar: true } },
    },
    // §6 vitrin sırası önce, sonra Türkçe ada göre (DB'de ICU collation).
    orderBy: [{ sira: "asc" }, { ad: "asc" }],
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-baslik text-2xl font-semibold text-text">Kurumlar</h1>
        <Button boyut="sm">
          <Link href="/yonetim/kurumlar/yeni">Yeni kurum</Link>
        </Button>
      </div>

      <p className="sayisal text-sm text-text-muted">{kurumlar.length} kurum</p>

      <Card>
        <ul className="divide-y divide-border">
          {kurumlar.map((kurum) => (
            <li key={kurum.id} className="flex items-center gap-3 p-3">
              {kurum.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- küçük sabit boyutlu liste görseli
                <img
                  src={kurum.logoUrl}
                  alt=""
                  className="size-8 shrink-0 rounded-sm border border-border object-contain"
                />
              ) : (
                <span
                  aria-hidden
                  style={kurumRengi(kurum.slug)}
                  className="kurum-zemin size-8 shrink-0 rounded-sm"
                />
              )}

              <div className="min-w-0 flex-1">
                <Link
                  href={`/yonetim/kurumlar/${kurum.id}`}
                  className="text-sm font-medium text-text hover:underline"
                >
                  {kurum.ad}
                </Link>
                <p className="text-xs text-text-muted">
                  {kurum.tip.ad} · {kurum._count.ilanlar} ilan · sıra {kurum.sira}
                </p>
              </div>

              {!kurum.aktifMi && <Badge varyant="notr">Pasif</Badge>}

              <Button varyant="hayalet" boyut="sm">
                <Link href={`/yayinevi/${kurum.slug}`}>Sitede</Link>
              </Button>

              <KurumSilButonu id={kurum.id} ad={kurum.ad} ilanSayisi={kurum._count.ilanlar} />
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
