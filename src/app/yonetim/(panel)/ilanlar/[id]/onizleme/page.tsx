import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardGovde } from "@/components/ui/card";
import { IlanKarti } from "@/components/ilan-karti";
import { kurumRengi } from "@/lib/kurum-tonu";
import { prisma } from "@/lib/prisma";
import { requireRol } from "@/lib/rbac";
import { formatTarih, formatTarihAralik, formatTarihSaat, kalanGun } from "@/lib/tarih";
import { VERSIYON_ADLARI, aktifVersiyon } from "@/lib/versiyon";

export const metadata: Metadata = { title: "İlan önizleme" };

const ZORLUK = { KOLAY: "Kolay", ORTA: "Orta", ZOR: "Zor" } as const;
const UYGULAMA = { TURKIYE_GENELI: "Türkiye Geneli", KURUMSAL: "Kurumsal" } as const;

// §6 Önizleme: "yayınlamadan önce ilanın sitede nasıl göründüğü, seçili
// versiyonda". Taslak ilanlar genel sitede görünmediği için (yayinDurumu
// filtresi) bu ekran gerekli — admin yayınlamadan önce sonucu göremezdi.
export default async function OnizlemeSayfasi({ params }: { params: Promise<{ id: string }> }) {
  await requireRol(["ADMIN", "EDITOR"]);
  const { id } = await params;

  const [ilan, versiyon] = await Promise.all([
    prisma.ilan.findUnique({
      where: { id },
      include: {
        kurum: { select: { id: true, ad: true, slug: true, logoUrl: true } },
        dagiticiKurum: { select: { ad: true, slug: true } },
        grup: { select: { id: true, ad: true, slug: true } },
        format: { select: { id: true, ad: true, slug: true } },
        duzeyler: { select: { id: true, ad: true, slug: true } },
        oturumlar: { orderBy: { sira: "asc" } },
      },
    }),
    aktifVersiyon(),
  ]);

  if (!ilan) notFound();

  const simdi = new Date();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-baslik text-2xl font-semibold text-text">Önizleme</h1>
        <div className="flex items-center gap-2">
          <Badge varyant={ilan.yayinDurumu === "YAYINDA" ? "basari" : "uyari"}>
            {ilan.yayinDurumu}
          </Badge>
          <span className="text-sm text-text-muted">Görünüm: {VERSIYON_ADLARI[versiyon]}</span>
          <Button varyant="ikincil" boyut="sm">
            <Link href={`/yonetim/ilanlar/${ilan.id}`}>Düzenle</Link>
          </Button>
        </div>
      </div>

      {ilan.yayinDurumu !== "YAYINDA" && (
        <p className="rounded-md bg-warning-bg px-3 py-2 text-sm text-warning">
          Bu ilan yayında değil — genel sitede görünmüyor. Aşağıdaki, yayınlandığında nasıl
          görüneceğidir.
        </p>
      )}

      {/* Takvimde/listede görüneceği kart — genel siteyle AYNI bileşen. */}
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-text-muted">Listede</h2>
        <IlanKarti
          simdi={simdi}
          ilan={{
            id: ilan.id,
            baslik: ilan.baslik,
            slug: ilan.slug,
            seriNo: ilan.seriNo,
            sinavTarihi: ilan.sinavTarihi.toISOString().slice(0, 10),
            sinavBitisTarihi: ilan.sinavBitisTarihi?.toISOString().slice(0, 10) ?? null,
            saat: ilan.saat,
            sonSiparisTarihi: ilan.sonSiparisTarihi?.toISOString().slice(0, 10) ?? null,
            cevapAnahtariZamani: ilan.cevapAnahtariZamani?.toISOString() ?? null,
            uygulamaTipi: ilan.uygulamaTipi,
            zorluk: ilan.zorluk,
            oneCikar: ilan.oneCikar,
            puanOrtalama: ilan.puanOrtalama,
            puanSayisi: ilan.puanSayisi,
            kurum: ilan.kurum,
            dagiticiKurum: ilan.dagiticiKurum,
            grup: ilan.grup,
            format: ilan.format,
            duzeyler: ilan.duzeyler,
          }}
        />
      </section>

      {/* Detay sayfası düzeni (§4.7 sırası). */}
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-text-muted">Detay sayfasında</h2>
        <Card>
          <CardGovde className="flex flex-col gap-4 p-5">
            <div className="flex items-center gap-2">
              <span
                aria-hidden
                style={kurumRengi(ilan.kurum.slug)}
                className="kurum-zemin size-3 rounded-sm"
              />
              <span className="text-sm text-text-muted">{ilan.kurum.ad}</span>
            </div>

            <h3 className="font-baslik text-2xl font-bold text-text">{ilan.baslik}</h3>

            <div className="flex flex-wrap gap-1">
              <Badge varyant="cizgi">{UYGULAMA[ilan.uygulamaTipi]}</Badge>
              {ilan.zorluk && <Badge varyant="notr">{ZORLUK[ilan.zorluk]} zorluk</Badge>}
              <Badge varyant="notr">{ilan.format.ad}</Badge>
              {ilan.duzeyler.map((duzey) => (
                <Badge key={duzey.id} varyant="notr">
                  {duzey.ad}
                </Badge>
              ))}
            </div>

            <div className="flex flex-col items-center gap-1 rounded-md border border-border py-4">
              <p className="sayisal text-xl font-semibold text-text uppercase">
                {formatTarihAralik(ilan.sinavTarihi, ilan.sinavBitisTarihi)}
              </p>
              <p className="sayisal text-sm text-text-muted">{kalanGun(ilan.sinavTarihi, simdi)}</p>
            </div>

            {ilan.oturumlar.length > 0 && (
              <ul className="divide-y divide-border rounded-md border border-border">
                {ilan.oturumlar.map((oturum) => (
                  <li key={oturum.id} className="flex items-baseline gap-3 p-3">
                    <span className="font-medium text-text">{oturum.ad}</span>
                    <span className="sayisal text-sm text-text-muted">
                      {[
                        oturum.saat,
                        oturum.sureDk ? `${oturum.sureDk} dk` : null,
                        oturum.soruSayisi ? `${oturum.soruSayisi} soru` : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <dl className="divide-y divide-border rounded-md border border-border">
              {ilan.sonSiparisTarihi && (
                <Satir etiket="Son sipariş" deger={formatTarih(ilan.sonSiparisTarihi)} />
              )}
              {ilan.cevapAnahtariZamani && (
                <Satir etiket="Cevap anahtarı" deger={formatTarihSaat(ilan.cevapAnahtariZamani)} />
              )}
              {ilan.dagiticiKurum && <Satir etiket="Dağıtım" deger={ilan.dagiticiKurum.ad} />}
              <Satir etiket="Sezon" deger={ilan.sezon} />
            </dl>
          </CardGovde>
        </Card>
      </section>
    </div>
  );
}

function Satir({ etiket, deger }: { etiket: string; deger: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 p-3">
      <dt className="w-32 shrink-0 text-sm text-text-muted">{etiket}</dt>
      <dd className="sayisal text-sm text-text">{deger}</dd>
    </div>
  );
}
