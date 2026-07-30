import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { abonelikDurumu } from "@/app/(genel)/abonelik-actions";
import { BildirimDugmesi } from "@/components/bildirim-dugmesi";
import { IlanKarti } from "@/components/ilan-karti";
import { YorumBolumu } from "@/components/yorum-bolumu";
import { TakvimeEkle } from "@/components/takvime-ekle";
import { Badge } from "@/components/ui/badge";
import { Card, CardGovde } from "@/components/ui/card";
import { siteAdresi } from "@/lib/eposta";
import { googleTakvimBaglantisi } from "@/lib/ics";
import { kurumRengi } from "@/lib/kurum-tonu";
import { formatTarih, formatTarihAralik, formatTarihSaat, kalanGun } from "@/lib/tarih";
import { ayniHaftadakiIlanlar, ilanDetayi, seriDigerIlanlari } from "@/lib/veri/ilan";

const ZORLUK_ETIKETI = { KOLAY: "Kolay", ORTA: "Orta", ZOR: "Zor" } as const;
const UYGULAMA_ETIKETI = {
  TURKIYE_GENELI: "Türkiye Geneli",
  KURUMSAL: "Kurumsal",
} as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const ilan = await ilanDetayi(slug);
  if (!ilan) return { title: "İlan bulunamadı" };

  const tarih = formatTarihAralik(ilan.sinavTarihi, ilan.sinavBitisTarihi);
  return {
    title: ilan.baslik,
    description: `${ilan.kurum.ad} · ${tarih} · ${UYGULAMA_ETIKETI[ilan.uygulamaTipi]}`,
  };
}

export default async function IlanDetay({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ilan = await ilanDetayi(slug);
  if (!ilan) notFound();

  const [seriDigerleri, ayniHafta, abonelik] = await Promise.all([
    seriDigerIlanlari(ilan.id, ilan.kurum.id, ilan.format.id),
    ayniHaftadakiIlanlar(ilan.id, ilan.sinavTarihi),
    abonelikDurumu("ilan", ilan.id),
  ]);

  const simdi = new Date();

  // §7 SEO: schema.org/Event yapısal verisi.
  const yapisalVeri = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: ilan.baslik,
    startDate: ilan.sinavTarihi.toISOString().slice(0, 10),
    ...(ilan.sinavBitisTarihi ? { endDate: ilan.sinavBitisTarihi.toISOString().slice(0, 10) } : {}),
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    organizer: { "@type": "Organization", name: ilan.kurum.ad },
  };

  return (
    <article className="flex flex-col gap-5">
      <script
        type="application/ld+json"
        // Yapısal veri sabit ve sunucuda üretiliyor; kullanıcı girdisi değil.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(yapisalVeri) }}
      />

      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            style={kurumRengi(ilan.kurum.slug)}
            className="kurum-zemin size-3 rounded-sm"
          />
          <Link
            href={`/yayinevi/${ilan.kurum.slug}`}
            className="text-sm text-text-muted hover:underline"
          >
            {ilan.kurum.ad}
          </Link>
        </div>

        <h1 className="font-baslik text-2xl font-bold text-text">{ilan.baslik}</h1>

        <div className="flex flex-wrap gap-1">
          <Badge varyant="cizgi">{UYGULAMA_ETIKETI[ilan.uygulamaTipi]}</Badge>
          {ilan.il && <Badge varyant="notr">{ilan.il}</Badge>}
          {ilan.zorluk && <Badge varyant="notr">{ZORLUK_ETIKETI[ilan.zorluk]} zorluk</Badge>}
          <Badge varyant="notr">{ilan.format.ad}</Badge>
          {ilan.duzeyler.map((duzey) => (
            <Badge key={duzey.id} varyant="notr">
              {duzey.ad}
            </Badge>
          ))}
        </div>
      </header>

      {/* §4.7: öğrencinin ilk sorusu "ne zaman?" */}
      <Card>
        <CardGovde className="flex flex-col items-center gap-1 p-5 text-center">
          <p className="sayisal text-xl font-semibold text-text uppercase">
            {formatTarihAralik(ilan.sinavTarihi, ilan.sinavBitisTarihi)}
          </p>
          <p className="sayisal text-sm text-text-muted">{kalanGun(ilan.sinavTarihi, simdi)}</p>
        </CardGovde>
      </Card>

      {ilan.oturumlar.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="font-baslik text-lg font-semibold text-text">Oturumlar</h2>
          <Card>
            <ul className="divide-y divide-border">
              {ilan.oturumlar.map((oturum) => (
                <li key={oturum.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 p-3">
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
          </Card>
        </section>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="font-baslik text-lg font-semibold text-text">Ayrıntılar</h2>
        <Card>
          <dl className="divide-y divide-border">
            {ilan.sonSiparisTarihi && (
              <Satir etiket="Son sipariş" deger={formatTarih(ilan.sonSiparisTarihi)} />
            )}
            {ilan.cevapAnahtariZamani && (
              <Satir etiket="Cevap anahtarı" deger={formatTarihSaat(ilan.cevapAnahtariZamani)} />
            )}
            {ilan.dagiticiKurum && (
              <Satir
                etiket="Dağıtım"
                deger={
                  <Link href={`/yayinevi/${ilan.dagiticiKurum.slug}`} className="hover:underline">
                    {ilan.dagiticiKurum.ad}
                  </Link>
                }
              />
            )}
            <Satir etiket="Sezon" deger={ilan.sezon} />
          </dl>
        </Card>
      </section>

      <div className="flex flex-wrap gap-2">
        {/* §4.7: Google Takvim şablon bağlantısı + .ics + yayınevinin
         * abone olunabilir akışı. OAuth yok. */}
        <TakvimeEkle
          googleUrl={googleTakvimBaglantisi({
            baslik: ilan.baslik,
            baslangic: ilan.sinavTarihi,
            bitis: ilan.sinavBitisTarihi,
            aciklama: `${ilan.kurum.ad} · ${UYGULAMA_ETIKETI[ilan.uygulamaTipi]}`,
            url: `${siteAdresi()}/ilan/${ilan.slug}`,
          })}
          icsUrl={`/api/ics/ilan/${ilan.slug}.ics`}
          akisUrl={`/api/ics/yayinevi/${ilan.kurum.slug}.ics`}
          akisEtiketi={`${ilan.kurum.ad} takvimine abone ol`}
        />

        {/* §4.8 abonelik seviyesi: tek ilan. */}
        <BildirimDugmesi hedef="ilan" hedefId={ilan.id} ad={ilan.baslik} baslangic={abonelik} />
        {ilan.detayUrl && (
          <a
            href={ilan.detayUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-kontrol-md items-center gap-2 rounded-md border border-border bg-surface px-4 text-sm font-medium text-text transition-colors hover:bg-surface-hover"
          >
            <ExternalLink size={16} strokeWidth={1.75} aria-hidden />
            Yayınevi sayfası
          </a>
        )}
      </div>

      {seriDigerleri.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="font-baslik text-lg font-semibold text-text">Bu seriden diğer ilanlar</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {seriDigerleri.map((diger) => (
              <IlanKarti key={diger.id} ilan={diger} simdi={simdi} />
            ))}
          </div>
        </section>
      )}

      {/* §4.9 değerlendirmeler — onaylı yorumlar + puan formu. */}
      <YorumBolumu ilanId={ilan.id} puanOrtalama={ilan.puanOrtalama} puanSayisi={ilan.puanSayisi} />

      {/* §4.7: "öğrenci çakışma olup olmadığını görmek ister" */}
      {ayniHafta.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="font-baslik text-lg font-semibold text-text">
            Aynı hafta yapılan diğer sınavlar
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {ayniHafta.map((diger) => (
              <IlanKarti key={diger.id} ilan={diger} simdi={simdi} />
            ))}
          </div>
        </section>
      )}
    </article>
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
