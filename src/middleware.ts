import { NextResponse, type NextRequest } from "next/server";

// §5: `?tema=v2` ile versiyon önizlemesi. Layout `searchParams` göremediği
// için parametre burada yakalanıp çereze yazılır; sonraki isteklerde de
// önizleme sürer. `?tema=` (boş) önizlemeyi kapatır.
const VERSIYONLAR = ["v1", "v2", "v3"];
const CEREZ = "versiyon-onizleme";

export function middleware(istek: NextRequest) {
  const istenen = istek.nextUrl.searchParams.get("tema");
  if (istenen === null) return NextResponse.next();

  const yanit = NextResponse.next();

  if (VERSIYONLAR.includes(istenen)) {
    yanit.cookies.set(CEREZ, istenen, { path: "/", sameSite: "lax" });
  } else {
    yanit.cookies.delete(CEREZ);
  }

  return yanit;
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico).*)"],
};
