"use server";

import { randomBytes } from "node:crypto";
import argon2 from "argon2";
import { AuthError } from "next-auth";

import { signIn } from "@/auth";
import { epostaGonder, siteAdresi } from "@/lib/eposta";
import { prisma } from "@/lib/prisma";
import { benzersizTakmaAd } from "@/lib/takma-ad";
import { kayitSemasi } from "@/lib/validations/uyelik";

export interface UyelikDurumu {
  hata?: string;
  alanHatalari?: Record<string, string>;
  bilgi?: string;
}

const DOGRULAMA_OMRU_SAAT = 48;

async function dogrulamaBaglantisiGonder(eposta: string): Promise<void> {
  // Auth.js'in standart VerificationToken tablosu yeniden kullanılıyor —
  // süre alanı zaten var, ayrı tablo açmaya gerek yok.
  const jeton = randomBytes(32).toString("base64url");
  const gecerlilik = new Date(Date.now() + DOGRULAMA_OMRU_SAAT * 60 * 60 * 1000);

  await prisma.verificationToken.deleteMany({ where: { identifier: eposta } });
  await prisma.verificationToken.create({
    data: { identifier: eposta, token: jeton, expires: gecerlilik },
  });

  const baglanti = `${siteAdresi()}/eposta-dogrula?jeton=${jeton}`;

  await epostaGonder({
    kime: eposta,
    konu: "E-posta adresinizi doğrulayın",
    metin: [
      "Sınav Takvimi'ne hoş geldiniz.",
      "",
      "Hesabınızı etkinleştirmek için bağlantıya tıklayın:",
      baglanti,
      "",
      `Bağlantı ${DOGRULAMA_OMRU_SAAT} saat geçerlidir.`,
      "Bu kaydı siz yapmadıysanız bu e-postayı yok sayabilirsiniz.",
    ].join("\n"),
  });
}

export async function kayitOl(
  _oncekiDurum: UyelikDurumu | undefined,
  formData: FormData,
): Promise<UyelikDurumu> {
  const ayristirilmis = kayitSemasi.safeParse({
    eposta: formData.get("eposta"),
    sifre: formData.get("sifre"),
    yasBeyani: formData.get("yasBeyani"),
  });

  if (!ayristirilmis.success) {
    const alanHatalari: Record<string, string> = {};
    for (const sorun of ayristirilmis.error.issues) {
      alanHatalari[String(sorun.path[0])] = sorun.message;
    }
    return { alanHatalari };
  }

  const { eposta, sifre } = ayristirilmis.data;

  const mevcut = await prisma.kullanici.findUnique({
    where: { eposta },
    select: { id: true, epostaDogrulandi: true },
  });

  if (mevcut) {
    // §7 güvenlik: "bu e-posta kayıtlı" demek hesap sayımına (enumeration)
    // izin verir. Doğrulanmamış hesaba bağlantıyı yeniden gönderip her
    // durumda aynı mesajı veriyoruz.
    if (!mevcut.epostaDogrulandi) await dogrulamaBaglantisiGonder(eposta);
    return {
      bilgi:
        "Kayıt isteğiniz alındı. E-postanıza bir doğrulama bağlantısı gönderdik; gelen kutunuzu kontrol edin.",
    };
  }

  // §4.9: takma ad havuzdan atanır, kullanıcı seçmez.
  const takmaAd = await benzersizTakmaAd(async (aday) => {
    const varMi = await prisma.kullanici.findUnique({
      where: { takmaAd: aday },
      select: { id: true },
    });
    return varMi !== null;
  });

  await prisma.kullanici.create({
    data: {
      eposta,
      sifreHash: await argon2.hash(sifre, { type: argon2.argon2id }),
      takmaAd,
      yasBeyani13Ustu: true,
      rol: "KULLANICI",
    },
  });

  await dogrulamaBaglantisiGonder(eposta);

  return {
    bilgi:
      "Kayıt isteğiniz alındı. E-postanıza bir doğrulama bağlantısı gönderdik; gelen kutunuzu kontrol edin.",
  };
}

export async function girisYapGenel(
  _oncekiDurum: UyelikDurumu | undefined,
  formData: FormData,
): Promise<UyelikDurumu> {
  const devam = (formData.get("devam") as string) || "/hesabim";
  const guvenliDevam = devam.startsWith("/") && !devam.startsWith("//") ? devam : "/hesabim";

  try {
    await signIn("credentials", {
      eposta: formData.get("eposta"),
      sifre: formData.get("sifre"),
      redirectTo: guvenliDevam,
    });
    return {};
  } catch (hata) {
    if (hata instanceof AuthError) {
      // Tek mesaj: hangi sebeple reddedildiği (hesap yok / şifre yanlış /
      // e-posta doğrulanmamış) sızdırılmıyor (§7).
      return {
        hata: "E-posta veya şifre hatalı ya da e-posta adresiniz henüz doğrulanmamış.",
      };
    }
    throw hata;
  }
}

export async function dogrulamaBaglantisiniTekrarGonder(
  _oncekiDurum: UyelikDurumu | undefined,
  formData: FormData,
): Promise<UyelikDurumu> {
  const eposta = ((formData.get("eposta") as string) || "").trim().toLowerCase();
  if (!eposta) return { hata: "E-posta adresinizi girin." };

  const kullanici = await prisma.kullanici.findUnique({
    where: { eposta },
    select: { epostaDogrulandi: true },
  });

  if (kullanici && !kullanici.epostaDogrulandi) {
    await dogrulamaBaglantisiGonder(eposta);
  }

  // Hesap sayımını engellemek için sonuç her durumda aynı.
  return { bilgi: "Hesap doğrulanmayı bekliyorsa bağlantı yeniden gönderildi." };
}

export async function cikisYapGenel(): Promise<void> {
  const { signOut } = await import("@/auth");
  // redirectTo verildiğinde signOut NEXT_REDIRECT fırlatır; buradan sonrası
  // çalışmaz.
  await signOut({ redirectTo: "/" });
}
