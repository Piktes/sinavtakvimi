import "server-only";
import nodemailer from "nodemailer";

// §1: Nodemailer. Geliştirmede SMTP genelde yapılandırılmamış olur; bu
// durumda gönderim SESSİZCE BAŞARISIZ OLMAZ — konsola düşer ve çağıran
// tarafa "yapılandırılmamış" bilgisi döner. Böylece kayıt akışı SMTP
// olmadan da test edilebiliyor, ama üretimde sorun görünmez kalmıyor.

export interface EpostaGirdisi {
  kime: string;
  konu: string;
  metin: string;
  html?: string;
}

export type GonderimSonucu =
  | { durum: "gonderildi"; saglayiciMesajId?: string }
  | { durum: "yapilandirilmamis" }
  | { durum: "hata"; mesaj: string };

function tasiyiciOlustur() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT ?? 587) === 465,
    auth: { user, pass },
  });
}

export async function epostaGonder(girdi: EpostaGirdisi): Promise<GonderimSonucu> {
  const tasiyici = tasiyiciOlustur();

  if (!tasiyici) {
    // Geliştirme kolaylığı: bağlantıyı konsoldan alıp elle açabilmek için.
    console.warn(`[e-posta yapılandırılmamış] ${girdi.kime} — ${girdi.konu}\n${girdi.metin}`);
    return { durum: "yapilandirilmamis" };
  }

  try {
    const sonuc = await tasiyici.sendMail({
      from: process.env.SMTP_FROM ?? "Sınav Takvimi <bildirim@localhost>",
      to: girdi.kime,
      subject: girdi.konu,
      text: girdi.metin,
      html: girdi.html,
    });
    return { durum: "gonderildi", saglayiciMesajId: sonuc.messageId };
  } catch (hata) {
    return { durum: "hata", mesaj: hata instanceof Error ? hata.message : "Bilinmeyen hata" };
  }
}

export function siteAdresi(): string {
  return process.env.AUTH_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
}
