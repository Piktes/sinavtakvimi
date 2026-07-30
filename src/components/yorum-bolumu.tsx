import { MessageSquareOff } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Yildiz } from "@/components/yildiz";
import { YorumFormu } from "@/components/yorum-formu";
import { esigeKalan, ortalamaGosterilir } from "@/lib/moderasyon/puan";
import { prisma } from "@/lib/prisma";
import { uyeVarsa } from "@/lib/rbac";
import { formatTarih } from "@/lib/tarih";

// §4.9: yorumlar admin onayından sonra yayınlanır; ortalama yalnızca
// onaylılardan ve en az 5 puan toplanana kadar gösterilmez.
//
// §12.3 yasak listesi burada da geçerli: yoruma yorum, kullanıcı profili
// bağlantısı, takip yok. Yazar yalnızca sistem takma adıyla görünür.
export async function YorumBolumu({
  ilanId,
  puanOrtalama,
  puanSayisi,
}: {
  ilanId: string;
  puanOrtalama: number | null;
  puanSayisi: number;
}) {
  const uye = await uyeVarsa();

  const [yorumlar, kendiYorumu] = await Promise.all([
    prisma.yorum.findMany({
      where: { ilanId, durum: "ONAYLANDI" },
      orderBy: { olusturulma: "desc" },
      take: 50,
      select: {
        id: true,
        puan: true,
        icerik: true,
        olusturulma: true,
        // Hesap silinmişse kullanıcı null olur; yorum anonim kalır (§2).
        kullanici: { select: { takmaAd: true } },
      },
    }),
    uye
      ? prisma.yorum.findUnique({
          where: { ilanId_kullaniciId: { ilanId, kullaniciId: uye.kullaniciId } },
          select: { puan: true, icerik: true, durum: true },
        })
      : null,
  ]);

  const gosterilir = ortalamaGosterilir(puanSayisi);

  return (
    <section id="yorumlar" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-baslik text-lg font-semibold text-text">Değerlendirmeler</h2>

        {gosterilir && puanOrtalama !== null ? (
          <div className="flex items-center gap-2">
            <Yildiz deger={puanOrtalama} etiket={`${puanOrtalama} / 5 ortalama`} />
            <span className="sayisal text-sm text-text">{puanOrtalama}</span>
            <span className="text-sm text-text-muted">({puanSayisi} değerlendirme)</span>
          </div>
        ) : (
          // §4.9: az sayıda puan yanıltıcı bir ortalama üretir; sayı
          // gizlenmiyor, yalnızca ortalama bekletiliyor.
          <span className="text-sm text-text-muted">
            {puanSayisi === 0
              ? "Henüz değerlendirme yok"
              : `${puanSayisi} değerlendirme · ortalama için ${esigeKalan(puanSayisi)} tane daha gerekiyor`}
          </span>
        )}
      </div>

      {kendiYorumu?.durum === "BEKLIYOR" && (
        <p className="rounded-md bg-warning-bg px-3 py-2 text-sm text-warning">
          Yorumunuz moderatör onayı bekliyor; onaylanana kadar yalnızca siz görüyorsunuz.
        </p>
      )}
      {kendiYorumu?.durum === "REDDEDILDI" && (
        <p className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">
          Yorumunuz yayınlanmadı. Düzenleyip yeniden gönderebilirsiniz.
        </p>
      )}

      <YorumFormu
        ilanId={ilanId}
        girisli={uye !== null}
        epostaDogrulandi={uye?.epostaDogrulandi ?? false}
        mevcut={kendiYorumu}
      />

      {yorumlar.length === 0 ? (
        <EmptyState
          ikon={MessageSquareOff}
          baslik="Henüz yayınlanmış yorum yok"
          aciklama="Bu denemeye giren ilk kişi siz olabilirsiniz."
        />
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {yorumlar.map((yorum) => (
            <li key={yorum.id} className="flex flex-col gap-1.5 py-3 first:pt-0">
              <div className="flex flex-wrap items-center gap-2">
                {/* §4.9: serbest metin ad yok, sistem takma adı. */}
                <span className="text-sm font-medium text-text">
                  {yorum.kullanici?.takmaAd ?? "Silinmiş hesap"}
                </span>
                {yorum.puan !== null && <Yildiz deger={yorum.puan} boyut={13} />}
                <span className="text-xs text-text-faint">{formatTarih(yorum.olusturulma)}</span>
              </div>
              {/* §7: kullanıcı içeriği HTML olarak render EDİLMEZ. React
               * metni zaten kaçışlıyor; dangerouslySetInnerHTML kullanılmıyor. */}
              {yorum.icerik && (
                <p className="text-sm whitespace-pre-line text-text-muted">{yorum.icerik}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
