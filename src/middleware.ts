import NextAuth from "next-auth";
import { NextResponse, type NextRequest } from "next/server";
import { authConfig } from "@/auth.config";

// Edge runtime — Prisma/argon2 içermeyen authConfig kullanılır (bkz. auth.ts).
const { auth } = NextAuth(authConfig);

// §5: `?tema=v2` ile versiyon önizlemesi. Layout `searchParams` göremediği
// için parametre burada yakalanıp çereze yazılır. `?tema=` (boş) kapatır.
const VERSIYONLAR = ["v1", "v2", "v3"];
const VERSIYON_CEREZI = "versiyon-onizleme";

// §6: rota → asgari rol. Bu, iki katmanlı yetki kontrolünün İLK katmanı;
// ikincisi her sayfa/action içindeki requireRol() (bkz. src/lib/rbac.ts).
// Middleware tek başına yeterli değil — server action'lar doğrudan çağrılabilir.
const ROTA_ROLLERI: { onEk: string; roller: string[] }[] = [
  { onEk: "/yonetim/ilanlar", roller: ["ADMIN", "EDITOR"] },
  { onEk: "/yonetim/yorumlar", roller: ["ADMIN", "MODERATOR"] },
  { onEk: "/yonetim/kurumlar", roller: ["ADMIN", "EDITOR"] },
  { onEk: "/yonetim/etiketler", roller: ["ADMIN", "EDITOR"] },
  { onEk: "/yonetim/koleksiyonlar", roller: ["ADMIN", "EDITOR"] },
  { onEk: "/yonetim/kullanicilar", roller: ["ADMIN"] },
  { onEk: "/yonetim/sistem", roller: ["ADMIN"] },
];

const SERBEST_ROTALAR = ["/yonetim/giris", "/yonetim/yetkisiz", "/yonetim/sifre-degistir"];

function versiyonCerezi(istek: NextRequest, yanit: NextResponse): NextResponse {
  const istenen = istek.nextUrl.searchParams.get("tema");
  if (istenen === null) return yanit;

  if (VERSIYONLAR.includes(istenen)) {
    yanit.cookies.set(VERSIYON_CEREZI, istenen, { path: "/", sameSite: "lax" });
  } else {
    yanit.cookies.delete(VERSIYON_CEREZI);
  }
  return yanit;
}

export default auth((istek) => {
  const { pathname } = istek.nextUrl;

  if (!pathname.startsWith("/yonetim")) {
    return versiyonCerezi(istek, NextResponse.next());
  }

  if (SERBEST_ROTALAR.some((rota) => pathname.startsWith(rota))) {
    return versiyonCerezi(istek, NextResponse.next());
  }

  const kullanici = istek.auth?.user as { rol?: string } | undefined;

  if (!kullanici) {
    const girisUrl = new URL("/yonetim/giris", istek.nextUrl.origin);
    girisUrl.searchParams.set("devam", pathname);
    return NextResponse.redirect(girisUrl);
  }

  if (!kullanici.rol || kullanici.rol === "KULLANICI") {
    return NextResponse.redirect(new URL("/yonetim/yetkisiz", istek.nextUrl.origin));
  }

  const kural = ROTA_ROLLERI.find((r) => pathname.startsWith(r.onEk));
  if (kural && !kural.roller.includes(kullanici.rol)) {
    return NextResponse.redirect(new URL("/yonetim/yetkisiz", istek.nextUrl.origin));
  }

  return versiyonCerezi(istek, NextResponse.next());
});

export const config = {
  matcher: ["/((?!_next|api|favicon.ico).*)"],
};
