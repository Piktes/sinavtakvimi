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
        const genisletilmis = user as typeof user & { rol?: string };
        token.rol = genisletilmis.rol;
      }
      return token;
    },
    session({ session, token }) {
      // `next-auth/jwt` modül augmentation'ı bir re-export barrel'ini
      // hedeflediği için TS ile güvenilir birleşmiyor; elle cast ediliyor.
      const t = token as typeof token & { rol?: string; sub?: string };
      if (session.user) {
        session.user.id = t.sub ?? "";
        (session.user as typeof session.user & { rol?: string }).rol = t.rol;
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
