import "server-only";
import { redirect } from "next/navigation";
import { auth, type PanelRolu } from "@/auth";
import { prisma } from "@/lib/prisma";

export interface PanelOturumu {
  kullaniciId: string;
  eposta: string;
  takmaAd: string;
  rol: PanelRolu;
}

// §6: "Yetki kontrolü hem middleware'de hem server action içinde — middleware
// tek başına yeterli değil, action doğrudan çağrılabilir."
//
// Ayrıca burada rol ve hesap durumu HER ÇAĞRIDA DB'den okunur. §1 "database
// session" hedefinin asıl kazanımı olan anında iptal edilebilirlik böyle
// sağlanıyor: admin bir hesabı askıya alır almaz, elindeki JWT hâlâ geçerli
// olsa bile bu kontrol onu keser (bkz. auth.config.ts'teki not).
export async function requireRol(izinliRoller: readonly PanelRolu[]): Promise<PanelOturumu> {
  const oturum = await auth();
  if (!oturum?.user?.id) redirect("/yonetim/giris");

  const kullanici = await prisma.kullanici.findUnique({
    where: { id: oturum.user.id },
    select: {
      id: true,
      eposta: true,
      takmaAd: true,
      rol: true,
      durum: true,
      sifreDegistirmeZorunlu: true,
      oturumSurumu: true,
    },
  });

  if (!kullanici || kullanici.durum !== "AKTIF") redirect("/yonetim/giris");

  // Token'daki sürüm DB'dekinden eskiyse oturum iptal edilmiştir (ör. şifre
  // değişti). JWT kriptografik olarak hâlâ geçerli olsa da burada kesilir.
  const tokenSurumu = (oturum.user as { oturumSurumu?: number }).oturumSurumu;
  if (tokenSurumu !== kullanici.oturumSurumu) redirect("/yonetim/giris");

  if (kullanici.rol === "KULLANICI") redirect("/yonetim/yetkisiz");
  if (kullanici.sifreDegistirmeZorunlu) redirect("/yonetim/sifre-degistir");
  if (!izinliRoller.includes(kullanici.rol as PanelRolu)) redirect("/yonetim/yetkisiz");

  return {
    kullaniciId: kullanici.id,
    eposta: kullanici.eposta,
    takmaAd: kullanici.takmaAd,
    rol: kullanici.rol as PanelRolu,
  };
}

// Şifre değiştirme sayfası için: rol kontrolü yapar ama şifre zorunluluğunda
// döngüye girmez.
export async function requireGiris(): Promise<PanelOturumu> {
  const oturum = await auth();
  if (!oturum?.user?.id) redirect("/yonetim/giris");

  const kullanici = await prisma.kullanici.findUnique({
    where: { id: oturum.user.id },
    select: { id: true, eposta: true, takmaAd: true, rol: true, durum: true },
  });

  if (!kullanici || kullanici.durum !== "AKTIF") redirect("/yonetim/giris");
  if (kullanici.rol === "KULLANICI") redirect("/yonetim/yetkisiz");

  return {
    kullaniciId: kullanici.id,
    eposta: kullanici.eposta,
    takmaAd: kullanici.takmaAd,
    rol: kullanici.rol as PanelRolu,
  };
}

export interface UyeOturumu {
  kullaniciId: string;
  eposta: string;
  takmaAd: string;
  epostaDogrulandi: boolean;
  duzeyId: string | null;
}

// Genel site üyeliği (§4.9). Panel rolleri de üyedir — admin kendi
// aboneliklerini yönetebilmeli — o yüzden rol filtresi yok, yalnızca
// oturum + hesap durumu + oturum sürümü doğrulanıyor.
export async function requireUye(devam = "/hesabim"): Promise<UyeOturumu> {
  const oturum = await auth();
  const gerial = `/giris?devam=${encodeURIComponent(devam)}`;
  if (!oturum?.user?.id) redirect(gerial);

  const kullanici = await prisma.kullanici.findUnique({
    where: { id: oturum.user.id },
    select: {
      id: true,
      eposta: true,
      takmaAd: true,
      durum: true,
      epostaDogrulandi: true,
      duzeyId: true,
      oturumSurumu: true,
    },
  });

  if (!kullanici || kullanici.durum !== "AKTIF") redirect(gerial);

  const tokenSurumu = (oturum.user as { oturumSurumu?: number }).oturumSurumu;
  if (tokenSurumu !== kullanici.oturumSurumu) redirect(gerial);

  return {
    kullaniciId: kullanici.id,
    eposta: kullanici.eposta,
    takmaAd: kullanici.takmaAd,
    epostaDogrulandi: kullanici.epostaDogrulandi,
    duzeyId: kullanici.duzeyId,
  };
}

// Oturum varsa üyeyi döndürür, yoksa null — yönlendirme yapmaz.
// Kart üzerindeki "abone ol" düğmesi gibi, girişsiz de render edilen
// yerlerde kullanılır.
export async function uyeVarsa(): Promise<UyeOturumu | null> {
  const oturum = await auth();
  if (!oturum?.user?.id) return null;

  const kullanici = await prisma.kullanici.findUnique({
    where: { id: oturum.user.id },
    select: {
      id: true,
      eposta: true,
      takmaAd: true,
      durum: true,
      epostaDogrulandi: true,
      duzeyId: true,
      oturumSurumu: true,
    },
  });

  if (!kullanici || kullanici.durum !== "AKTIF") return null;
  const tokenSurumu = (oturum.user as { oturumSurumu?: number }).oturumSurumu;
  if (tokenSurumu !== kullanici.oturumSurumu) return null;

  return {
    kullaniciId: kullanici.id,
    eposta: kullanici.eposta,
    takmaAd: kullanici.takmaAd,
    epostaDogrulandi: kullanici.epostaDogrulandi,
    duzeyId: kullanici.duzeyId,
  };
}
