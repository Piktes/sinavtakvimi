import type { NextAuthConfig } from "next-auth";

// Edge runtime'da çalışan asgari yapılandırma — middleware bunu kullanır.
// Prisma ve argon2 burada YOK (ikisi de Edge'de çalışmaz); tam yapılandırma
// `src/auth.ts` içinde.
export const authConfig = {
  pages: {
    signIn: "/yonetim/giris",
  },
  session: {
    // §1 "database session" hedefi: @auth/core 0.41.3'te Credentials sağlayıcısı
    // koşulsuz JWT üretiyor (lib/actions/callback/index.js — jwt.encode ile
    // çereze yazıyor, adapter.createSession hiç çağrılmıyor). Bu yüzden
    // strateji zorunlu olarak "jwt".
    //
    // Database session'ın asıl kazandırdığı ANINDA İPTAL edilebilirlik
    // `src/lib/rbac.ts:oturumuDogrula` ile korunuyor: rol ve hesap durumu her
    // korumalı istekte DB'den okunuyor, token'daki değere güvenilmiyor.
    strategy: "jwt",
    maxAge: 60 * 60 * 24,
  },
  callbacks: {
    // Token'daki rol middleware'e taşınır — kaba kapı için yeterli.
    // İnce ve güvenilir kontrol server action/sayfa içindeki requireRol().
    jwt({ token, user }) {
      if (user) {
        const genisletilmis = user as typeof user & { rol?: string; oturumSurumu?: number };
        token.rol = genisletilmis.rol;
        token.oturumSurumu = genisletilmis.oturumSurumu;
      }
      return token;
    },
    session({ session, token }) {
      // `next-auth/jwt` modül augmentation'ı bir re-export barrel'ini
      // hedeflediği için TS ile güvenilir birleşmiyor; elle cast ediliyor.
      const t = token as typeof token & {
        rol?: string;
        sub?: string;
        oturumSurumu?: number;
      };
      if (session.user) {
        const u = session.user as typeof session.user & {
          rol?: string;
          oturumSurumu?: number;
        };
        u.id = t.sub ?? "";
        u.rol = t.rol;
        u.oturumSurumu = t.oturumSurumu;
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
