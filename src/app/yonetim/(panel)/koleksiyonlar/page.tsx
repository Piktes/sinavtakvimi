import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { requireRol } from "@/lib/rbac";
import { filtreOku } from "@/lib/validations/koleksiyon";
import { KoleksiyonSilButonu } from "./sil-butonu";

// Kaydedilmiş filtrenin kaç faset içerdiğini özetler — listede "ne
// tanımlanmış" sorusuna bakışta cevap verir.
function filtreOzeti(filtre: ReturnType<typeof filtreOku>): string {
  const parcalar: string[] = [];
  if (filtre.grupIds.length) parcalar.push(`${filtre.grupIds.length} grup`);
  if (filtre.duzeyIds.length) parcalar.push(`${filtre.duzeyIds.length} düzey`);
  if (filtre.formatIds.length) parcalar.push(`${filtre.formatIds.length} format`);
  if (filtre.kurumIds.length) parcalar.push(`${filtre.kurumIds.length} kurum`);
  if (filtre.uygulamaTipi.length) parcalar.push("uygulama tipi");
  if (filtre.zorluk.length) parcalar.push("zorluk");
  if (filtre.baslikIcerir) parcalar.push(`başlık: "${filtre.baslikIcerir}"`);
  return parcalar.length ? parcalar.join(" · ") : "filtre yok (tüm ilanlar)";
}

export default async function KoleksiyonlarSayfasi() {
  await requireRol(["ADMIN", "EDITOR"]);

  const koleksiyonlar = await prisma.koleksiyon.findMany({
    orderBy: [{ sira: "asc" }, { ad: "asc" }],
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-baslik text-2xl font-semibold text-text">Koleksiyonlar</h1>
          <p className="text-sm text-text-muted">
            Sitenin üst menüsündeki sekmeler. Her sekme kaydedilmiş bir filtredir.
          </p>
        </div>
        <Button boyut="sm">
          <Link href="/yonetim/koleksiyonlar/yeni">Yeni koleksiyon</Link>
        </Button>
      </div>

      <Card>
        <ul className="divide-y divide-border">
          {koleksiyonlar.map((koleksiyon) => (
            <li key={koleksiyon.id} className="flex items-center gap-3 p-3">
              <span className="sayisal w-8 shrink-0 text-sm text-text-muted">
                {koleksiyon.sira}
              </span>

              <div className="min-w-0 flex-1">
                <Link
                  href={`/yonetim/koleksiyonlar/${koleksiyon.id}`}
                  className="text-sm font-medium text-text hover:underline"
                >
                  {koleksiyon.ad}
                </Link>
                <p className="truncate text-xs text-text-muted">
                  /k/{koleksiyon.slug} · {filtreOzeti(filtreOku(koleksiyon.filtre))}
                </p>
              </div>

              {!koleksiyon.aktifMi && <Badge varyant="notr">Pasif</Badge>}
              {koleksiyon.aktifMi && !koleksiyon.menudeMi && (
                <Badge varyant="notr">Menüde yok</Badge>
              )}

              <Button varyant="hayalet" boyut="sm">
                <Link href={`/k/${koleksiyon.slug}`}>Sitede</Link>
              </Button>

              <KoleksiyonSilButonu id={koleksiyon.id} ad={koleksiyon.ad} />
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
