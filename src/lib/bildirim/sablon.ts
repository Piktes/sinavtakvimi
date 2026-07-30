import "server-only";
import { siteAdresi } from "@/lib/eposta";
import { imzaliJetonUret } from "@/lib/imzali-baglanti";
import { formatTarih, kalanGunSayisi } from "@/lib/tarih";
import { OFSET_ETIKETLERI } from "@/lib/abonelik";

export interface HatirlatmaGirdisi {
  abonelikId: string;
  takmaAd: string;
  ofset: number;
  ilan: {
    baslik: string;
    slug: string;
    sinavTarihi: Date;
    saat: string | null;
    kurumAdi: string;
    formatAdi: string;
  };
  /** Aboneliğin hangi seviyeden geldiği — "neden bu e-postayı aldım?" cevabı. */
  kaynak: string;
}

/**
 * §4.8: "Her e-postada giriş gerektirmeyen imzalı abonelikten çık bağlantısı."
 * Jeton DB'de tutulmuyor; HMAC kendi kendini doğruluyor (lib/imzali-baglanti.ts).
 */
export function abonelikCikisBaglantisi(abonelikId: string): string {
  const jeton = imzaliJetonUret({ abonelikId, eylem: "cik" });
  return `${siteAdresi()}/abonelikten-cik?jeton=${jeton}`;
}

function baslikMetni(girdi: HatirlatmaGirdisi): string {
  const kalan = kalanGunSayisi(girdi.ilan.sinavTarihi, new Date());
  if (girdi.ofset === 0) return `Bugün: ${girdi.ilan.baslik}`;
  if (kalan === 1) return `Yarın: ${girdi.ilan.baslik}`;
  return `${girdi.ofset} gün kaldı: ${girdi.ilan.baslik}`;
}

export function hatirlatmaEpostasi(girdi: HatirlatmaGirdisi): {
  konu: string;
  metin: string;
} {
  const adres = `${siteAdresi()}/ilan/${girdi.ilan.slug}`;
  const cikis = abonelikCikisBaglantisi(girdi.abonelikId);

  const metin = [
    `Merhaba ${girdi.takmaAd},`,
    "",
    `${girdi.ilan.kurumAdi} · ${girdi.ilan.formatAdi}`,
    `${girdi.ilan.baslik}`,
    `${formatTarih(girdi.ilan.sinavTarihi)}${girdi.ilan.saat ? ` · ${girdi.ilan.saat}` : ""}`,
    "",
    `Ayrıntılar: ${adres}`,
    "",
    "—",
    // §7: kullanıcı bu e-postayı neden aldığını görebilmeli.
    `Bu hatırlatmayı "${girdi.kaynak}" aboneliğiniz (${OFSET_ETIKETLERI[girdi.ofset] ?? `${girdi.ofset} gün önce`}) nedeniyle aldınız.`,
    `Aboneliği kapatmak için: ${cikis}`,
    "",
    "Sınav Takvimi resmî bir kurum sitesi değildir; bağlayıcı kaynak yayınevinin kendi duyurusudur.",
  ].join("\n");

  return { konu: baslikMetni(girdi), metin };
}

export interface TarihDegisikligiGirdisi {
  abonelikId: string;
  takmaAd: string;
  ilan: { baslik: string; slug: string; kurumAdi: string };
  eskiTarih: Date;
  yeniTarih: Date;
  kaynak: string;
}

/**
 * §4.8: "Tarih değişirse ... abonelere ayrı 'tarih değişti' bildirimi gider
 * (tercihten bağımsız, kritik bilgi)." Ofset tercihleri bu e-postayı
 * etkilemez; bu yüzden ayrı şablon.
 */
export function tarihDegistiEpostasi(girdi: TarihDegisikligiGirdisi): {
  konu: string;
  metin: string;
} {
  const adres = `${siteAdresi()}/ilan/${girdi.ilan.slug}`;
  const cikis = abonelikCikisBaglantisi(girdi.abonelikId);

  const metin = [
    `Merhaba ${girdi.takmaAd},`,
    "",
    `Takip ettiğiniz bir sınavın tarihi değişti:`,
    "",
    `${girdi.ilan.kurumAdi} — ${girdi.ilan.baslik}`,
    `Eski tarih: ${formatTarih(girdi.eskiTarih)}`,
    `Yeni tarih: ${formatTarih(girdi.yeniTarih)}`,
    "",
    `Ayrıntılar: ${adres}`,
    "",
    "Hatırlatmalarınız yeni tarihe göre yeniden planlandı.",
    "",
    "—",
    `Bu bildirimi "${girdi.kaynak}" aboneliğiniz nedeniyle aldınız; tarih değişikliği kritik bilgi olduğu için hatırlatma tercihinizden bağımsız gönderilir.`,
    `Aboneliği kapatmak için: ${cikis}`,
  ].join("\n");

  return { konu: `Tarih değişti: ${girdi.ilan.baslik}`, metin };
}
