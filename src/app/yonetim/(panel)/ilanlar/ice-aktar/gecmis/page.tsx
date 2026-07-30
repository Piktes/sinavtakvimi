import type { Metadata } from "next";
import Link from "next/link";
import { History } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { prisma } from "@/lib/prisma";
import { requireRol } from "@/lib/rbac";
import { formatTarihSaat } from "@/lib/tarih";
import { GeriAlButonu } from "../geri-al-butonu";

export const metadata: Metadata = { title: "Yükleme geçmişi" };

// §4.2: "ImportBatch sayesinde hatalı yükleme tek işlemle geri alınır."
export default async function IceAktarmaGecmisi() {
  await requireRol(["ADMIN", "EDITOR"]);

  const partiler = await prisma.iceAktarmaPartisi.findMany({
    select: {
      id: true,
      dosyaAdi: true,
      satirSayisi: true,
      basarili: true,
      hatali: true,
      durum: true,
      zaman: true,
      geriAlindi: true,
      admin: { select: { takmaAd: true } },
      _count: { select: { ilanlar: true } },
    },
    orderBy: { zaman: "desc" },
    take: 50,
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-baslik text-2xl font-semibold text-text">Yükleme geçmişi</h1>
          <p className="text-sm text-text-muted">
            Her CSV yüklemesi burada kaydedilir ve tek işlemle geri alınabilir.
          </p>
        </div>
        <Button varyant="ikincil" boyut="sm">
          <Link href="/yonetim/ilanlar/ice-aktar">Yeni yükleme</Link>
        </Button>
      </div>

      {partiler.length === 0 ? (
        <EmptyState
          ikon={History}
          baslik="Henüz yükleme yapılmadı"
          aciklama="Excel/CSV ile ilan aktardığınızda kayıtlar burada listelenir."
          eylem={
            <Button varyant="ikincil" boyut="sm">
              <Link href="/yonetim/ilanlar/ice-aktar">İçe aktarmaya git</Link>
            </Button>
          }
        />
      ) : (
        <Card>
          <ul className="divide-y divide-border">
            {partiler.map((parti) => {
              const geriAlindi = parti.durum === "GERI_ALINDI";
              return (
                <li key={parti.id} className="flex flex-wrap items-center gap-3 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text">{parti.dosyaAdi}</p>
                    <p className="sayisal text-xs text-text-muted">
                      {formatTarihSaat(parti.zaman)}
                      {parti.admin && ` · ${parti.admin.takmaAd}`}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2 text-xs text-text-muted">
                    <span className="sayisal">{parti.satirSayisi} satır okundu</span>
                    <Badge varyant="basari">{parti.basarili} eklendi</Badge>
                    {parti.hatali > 0 && <Badge varyant="tehlike">{parti.hatali} hatalı</Badge>}
                  </div>

                  {geriAlindi ? (
                    <div className="flex shrink-0 flex-col items-end">
                      <Badge varyant="notr">Geri alındı</Badge>
                      {parti.geriAlindi && (
                        <span className="sayisal text-xs text-text-faint">
                          {formatTarihSaat(parti.geriAlindi)}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="sayisal text-xs text-text-muted">
                        {parti._count.ilanlar} ilan duruyor
                      </span>
                      <GeriAlButonu partiId={parti.id} />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      <p className="text-xs text-text-muted">
        Geri alma yalnızca hâlâ <strong>taslak</strong> olan ilanları siler. Yayınladığınız veya
        arşivlediğiniz ilanlar korunur — bunlar üzerinde bilinçli bir karar verilmiş sayılır.
      </p>
    </div>
  );
}
