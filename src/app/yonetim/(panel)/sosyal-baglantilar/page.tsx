import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { requireRol } from "@/lib/rbac";
import { SOSYAL_PLATFORM_ADLARI, type SosyalPlatform } from "@/lib/sosyal-platform";
import { SOSYAL_IKONLAR } from "@/components/sosyal-ikonlar";
import { SosyalSilButonu } from "./sil-butonu";

export default async function SosyalBaglantilarSayfasi() {
  await requireRol(["ADMIN", "EDITOR"]);

  const baglantilar = await prisma.sosyalBaglanti.findMany({
    orderBy: [{ sira: "asc" }],
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-baslik text-2xl font-semibold text-text">Sosyal bağlantılar</h1>
        <Button boyut="sm">
          <Link href="/yonetim/sosyal-baglantilar/yeni">Yeni bağlantı</Link>
        </Button>
      </div>

      <p className="text-sm text-text-muted">Sitede üst bar ve altbilgide ikon olarak görünür.</p>

      <Card>
        <ul className="divide-y divide-border">
          {baglantilar.map((baglanti) => {
            const Ikon = SOSYAL_IKONLAR[baglanti.platform as SosyalPlatform];
            return (
              <li key={baglanti.id} className="flex items-center gap-3 p-3">
                <Ikon size={20} strokeWidth={1.75} className="shrink-0 text-text-muted" />

                <div className="min-w-0 flex-1">
                  <Link
                    href={`/yonetim/sosyal-baglantilar/${baglanti.id}`}
                    className="text-sm font-medium text-text hover:underline"
                  >
                    {SOSYAL_PLATFORM_ADLARI[baglanti.platform as SosyalPlatform]}
                  </Link>
                  <p className="truncate text-xs text-text-muted">{baglanti.url}</p>
                </div>

                {!baglanti.aktifMi && <Badge varyant="notr">Pasif</Badge>}

                <SosyalSilButonu
                  id={baglanti.id}
                  etiket={SOSYAL_PLATFORM_ADLARI[baglanti.platform as SosyalPlatform]}
                />
              </li>
            );
          })}
          {baglantilar.length === 0 && (
            <li className="p-3 text-sm text-text-muted">Henüz sosyal bağlantı yok.</li>
          )}
        </ul>
      </Card>
    </div>
  );
}
