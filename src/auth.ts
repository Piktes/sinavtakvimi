import argon2 from "argon2";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/prisma";

// §6 rolleri. KULLANICI genel site üyesidir, panele giremez.
export const PANEL_ROLLERI = ["ADMIN", "EDITOR", "MODERATOR"] as const;
export type PanelRolu = (typeof PANEL_ROLLERI)[number];

const girisSemasi = z.object({
  eposta: z.email(),
  sifre: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        eposta: { label: "E-posta", type: "email" },
        sifre: { label: "Şifre", type: "password" },
      },
      async authorize(girdi) {
        const ayristirilmis = girisSemasi.safeParse(girdi);
        if (!ayristirilmis.success) return null;

        const { eposta, sifre } = ayristirilmis.data;

        const kullanici = await prisma.kullanici.findUnique({
          where: { eposta: eposta.toLowerCase() },
          select: {
            id: true,
            eposta: true,
            takmaAd: true,
            sifreHash: true,
            rol: true,
            durum: true,
            oturumSurumu: true,
          },
        });

        // Kullanıcı yoksa da argon2 doğrulaması yapılır: e-postanın kayıtlı
        // olup olmadığı yanıt süresinden anlaşılmasın (§7 güvenlik).
        const hash =
          kullanici?.sifreHash ??
          "$argon2id$v=19$m=65536,t=3,p=4$c2FodGVzYWx0MTIz$0000000000000000000000000000000000000000000";

        let dogruMu = false;
        try {
          dogruMu = await argon2.verify(hash, sifre);
        } catch {
          dogruMu = false;
        }

        if (!kullanici || !dogruMu) return null;
        if (kullanici.durum !== "AKTIF") return null;

        await prisma.kullanici.update({
          where: { id: kullanici.id },
          data: { sonGiris: new Date() },
        });

        return {
          id: kullanici.id,
          email: kullanici.eposta,
          name: kullanici.takmaAd,
          rol: kullanici.rol,
          oturumSurumu: kullanici.oturumSurumu,
        };
      },
    }),
  ],
});
