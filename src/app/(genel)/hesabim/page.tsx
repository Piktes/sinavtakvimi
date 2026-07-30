import { Bell, BellOff } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBaslik, CardGovde } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { prisma } from "@/lib/prisma";
import { requireUye } from "@/lib/rbac";
import { formatTarih } from "@/lib/tarih";
import { abonelikKaldir, hesabimdanCik } from "./hesabim-actions";
import { DuzeyFormu, SifreFormu } from "./hesap-formlari";

export const metadata: Metadata = { title: "Hesabım" };

// Oturuma bağlı; önbelleğe alınamaz.
export const dynamic = "force-dynamic";

function abonelikBasligi(abonelik: {
  ilan: { baslik: string; sinavTarihi: Date } | null;
  kurum: { ad: string } | null;
  koleksiyon: { ad: string } | null;
}): { tur: string; ad: string; ek?: string } {
  if (abonelik.ilan) {
    return {
      tur: "İlan",
      ad: abonelik.ilan.baslik,
      ek: formatTarih(abonelik.ilan.sinavTarihi),
    };
  }
  if (abonelik.kurum) return { tur: "Yayınevi", ad: abonelik.kurum.ad };
  if (abonelik.koleksiyon) return { tur: "Koleksiyon", ad: abonelik.koleksiyon.ad };
  return { tur: "Bilinmiyor", ad: "—" };
}

export default async function HesabimSayfasi() {
  const uye = await requireUye();

  const [duzeyler, abonelikler] = await Promise.all([
    prisma.etiket.findMany({
      where: { tip: "DUZEY", aktifMi: true },
      orderBy: [{ sira: "asc" }, { ad: "asc" }],
      select: { id: true, ad: true },
    }),
    prisma.abonelik.findMany({
      where: { kullaniciId: uye.kullaniciId },
      orderBy: { olusturulma: "desc" },
      select: {
        id: true,
        ofsetler: true,
        aktifMi: true,
        ilan: { select: { baslik: true, sinavTarihi: true } },
        kurum: { select: { ad: true } },
        koleksiyon: { select: { ad: true } },
      },
    }),
  ]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="font-baslik text-2xl font-semibold text-text">Hesabım</h1>
          <p className="text-sm text-text-muted">
            {uye.takmaAd} · {uye.eposta}
          </p>
        </div>
        <form action={hesabimdanCik}>
          <Button type="submit" varyant="ikincil" boyut="sm">
            Çıkış yap
          </Button>
        </form>
      </div>

      {!uye.epostaDogrulandi && (
        <p className="rounded-md bg-warning-bg px-3 py-2 text-sm text-warning">
          E-postanız henüz doğrulanmadı. Bildirimler doğrulanana kadar gönderilmez.
        </p>
      )}

      <Card>
        <CardBaslik>
          <h2 className="font-baslik text-base font-semibold text-text">Tercihler</h2>
        </CardBaslik>
        <CardGovde>
          <DuzeyFormu duzeyler={duzeyler} secili={uye.duzeyId} />
        </CardGovde>
      </Card>

      <Card>
        <CardBaslik>
          <h2 className="font-baslik text-base font-semibold text-text">Bildirimlerim</h2>
          <p className="text-sm text-text-muted">
            Abone olduğunuz ilan, yayınevi ve koleksiyonlar.
          </p>
        </CardBaslik>
        <CardGovde>
          {abonelikler.length === 0 ? (
            <EmptyState
              ikon={BellOff}
              baslik="Henüz aboneliğiniz yok"
              aciklama="Bir ilanın veya yayınevinin sayfasındaki zil simgesine dokunarak bildirim alabilirsiniz."
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
              {abonelikler.map((abonelik) => {
                const { tur, ad, ek } = abonelikBasligi(abonelik);
                return (
                  <li key={abonelik.id} className="flex items-center gap-3 py-3 first:pt-0">
                    <Bell size={16} strokeWidth={1.75} className="shrink-0 text-text-faint" />
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge varyant="cizgi">{tur}</Badge>
                        <span className="truncate text-sm font-medium text-text">{ad}</span>
                      </div>
                      <p className="text-xs text-text-muted">
                        {ek ? `${ek} · ` : ""}
                        {abonelik.ofsetler.length > 0
                          ? `${abonelik.ofsetler.join(", ")} gün önce hatırlat`
                          : "Hatırlatma kapalı"}
                      </p>
                    </div>
                    <form action={abonelikKaldir}>
                      <input type="hidden" name="abonelikId" value={abonelik.id} />
                      <Button type="submit" varyant="hayalet" boyut="sm">
                        Kaldır
                      </Button>
                    </form>
                  </li>
                );
              })}
            </ul>
          )}
        </CardGovde>
      </Card>

      <Card>
        <CardBaslik>
          <h2 className="font-baslik text-base font-semibold text-text">Şifre</h2>
        </CardBaslik>
        <CardGovde>
          <SifreFormu />
        </CardGovde>
      </Card>
    </div>
  );
}
