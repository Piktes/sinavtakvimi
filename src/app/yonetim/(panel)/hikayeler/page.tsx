import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { requireRol } from "@/lib/rbac";
import { HikayeSilButonu } from "./sil-butonu";

export default async function HikayelerSayfasi() {
  await requireRol(["ADMIN", "EDITOR"]);

  const hikayeler = await prisma.hikaye.findMany({
    orderBy: [{ sira: "asc" }, { olusturulma: "desc" }],
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-baslik text-2xl font-semibold text-text">Hikayeler</h1>
        <Button boyut="sm">
          <Link href="/yonetim/hikayeler/yeni">Yeni hikaye</Link>
        </Button>
      </div>

      <p className="text-sm text-text-muted">
        Ana sayfada Instagram hikayesi görünümünde gösterilir. Otomatik süresi dolmaz — buradan
        aktif/pasif yapılır.
      </p>

      <Card>
        <ul className="divide-y divide-border">
          {hikayeler.map((hikaye) => (
            <li key={hikaye.id} className="flex items-center gap-3 p-3">
              {/* eslint-disable-next-line @next/next/no-img-element -- küçük sabit boyutlu liste görseli */}
              <img
                src={hikaye.gorselUrl}
                alt=""
                className="h-12 w-8 shrink-0 rounded-sm border border-border object-cover"
              />

              <div className="min-w-0 flex-1">
                <Link
                  href={`/yonetim/hikayeler/${hikaye.id}`}
                  className="text-sm font-medium text-text hover:underline"
                >
                  {hikaye.baslik}
                </Link>
                <p className="text-xs text-text-muted">
                  Sıra {hikaye.sira}
                  {hikaye.baglanti && <> · {hikaye.baglanti}</>}
                </p>
              </div>

              {!hikaye.aktifMi && <Badge varyant="notr">Pasif</Badge>}

              <HikayeSilButonu id={hikaye.id} baslik={hikaye.baslik} />
            </li>
          ))}
          {hikayeler.length === 0 && (
            <li className="p-3 text-sm text-text-muted">Henüz hikaye yok.</li>
          )}
        </ul>
      </Card>
    </div>
  );
}
