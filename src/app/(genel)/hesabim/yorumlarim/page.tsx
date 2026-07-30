import { MessageSquareOff } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { yorumSil } from "@/app/(genel)/yorum-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBaslik, CardGovde } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Yildiz } from "@/components/yildiz";
import { prisma } from "@/lib/prisma";
import { requireUye } from "@/lib/rbac";
import { formatTarih } from "@/lib/tarih";

export const metadata: Metadata = { title: "Yorumlarım" };
export const dynamic = "force-dynamic";

// §4.6 rota listesi: /hesabim/yorumlarim.
// Kullanıcı kendi yorumunun HANGİ DURUMDA olduğunu görebilmeli — sitede
// göremediği bir yorumun kaybolduğunu sanmasın.
const DURUM: Record<
  string,
  { etiket: string; varyant: "notr" | "basari" | "uyari" | "tehlike"; aciklama: string }
> = {
  BEKLIYOR: {
    etiket: "Onay bekliyor",
    varyant: "uyari",
    aciklama: "Moderatör onayından sonra yayınlanacak.",
  },
  ONAYLANDI: { etiket: "Yayında", varyant: "basari", aciklama: "İlan sayfasında görünüyor." },
  REDDEDILDI: {
    etiket: "Yayınlanmadı",
    varyant: "tehlike",
    aciklama: "Düzenleyip yeniden gönderebilirsiniz.",
  },
  SPAM: {
    etiket: "Spam işaretlendi",
    varyant: "tehlike",
    aciklama: "Bu yorum yayınlanmayacak.",
  },
};

export default async function YorumlarimSayfasi() {
  const uye = await requireUye("/hesabim/yorumlarim");

  const yorumlar = await prisma.yorum.findMany({
    where: { kullaniciId: uye.kullaniciId },
    orderBy: { olusturulma: "desc" },
    select: {
      id: true,
      puan: true,
      icerik: true,
      durum: true,
      olusturulma: true,
      ilan: { select: { baslik: true, slug: true } },
    },
  });

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="font-baslik text-2xl font-semibold text-text">Yorumlarım</h1>
        <p className="text-sm text-text-muted">
          Yazdığınız yorumlar ve durumları.{" "}
          <Link href="/hesabim" className="underline">
            Hesabıma dön
          </Link>
        </p>
      </div>

      <Card>
        <CardBaslik>
          <h2 className="font-baslik text-base font-semibold text-text">{yorumlar.length} yorum</h2>
        </CardBaslik>
        <CardGovde>
          {yorumlar.length === 0 ? (
            <EmptyState
              ikon={MessageSquareOff}
              baslik="Henüz yorum yazmadınız"
              aciklama="Girdiğiniz bir denemenin sayfasından puan verip yorum yazabilirsiniz."
              eylem={
                <Link href="/takvim">
                  <Button varyant="ikincil" boyut="sm">
                    Takvime göz at
                  </Button>
                </Link>
              }
            />
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {yorumlar.map((yorum) => {
                const durum = DURUM[yorum.durum] ?? DURUM.BEKLIYOR;
                return (
                  <li key={yorum.id} className="flex flex-col gap-1.5 py-3 first:pt-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge varyant={durum.varyant}>{durum.etiket}</Badge>
                      <Link
                        href={`/ilan/${yorum.ilan.slug}#yorumlar`}
                        className="text-sm font-medium text-text hover:underline"
                      >
                        {yorum.ilan.baslik}
                      </Link>
                      {yorum.puan !== null && <Yildiz deger={yorum.puan} boyut={13} />}
                      <span className="text-xs text-text-faint">
                        {formatTarih(yorum.olusturulma)}
                      </span>
                    </div>

                    {yorum.icerik && (
                      <p className="text-sm whitespace-pre-line text-text-muted">{yorum.icerik}</p>
                    )}

                    <div className="flex items-center gap-3">
                      <span className="text-xs text-text-faint">{durum.aciklama}</span>
                      <form action={yorumSil} className="ml-auto">
                        <input type="hidden" name="yorumId" value={yorum.id} />
                        <Button type="submit" varyant="hayalet" boyut="sm">
                          Sil
                        </Button>
                      </form>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardGovde>
      </Card>
    </div>
  );
}
