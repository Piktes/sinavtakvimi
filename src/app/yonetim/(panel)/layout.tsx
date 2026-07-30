import type { Metadata } from "next";
import Link from "next/link";
import { requireRol } from "@/lib/rbac";
import { PANEL_ROLLERI } from "@/auth";
import { roleGoreNav } from "@/lib/yonetim-nav";
import { CikisFormu } from "./cikis-formu";
import { YanMenu } from "./yan-menu";

export const metadata: Metadata = {
  title: { default: "Yönetim", template: "%s · Yönetim" },
  robots: { index: false, follow: false },
};

export default async function YonetimDuzeni({ children }: { children: React.ReactNode }) {
  // §6: iki katmanlı yetkinin ikinci katmanı. Rol ve hesap durumu DB'den
  // okunur — middleware'deki token değerine güvenilmez.
  const oturum = await requireRol(PANEL_ROLLERI);

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
          <Link href="/yonetim" className="font-baslik font-bold text-text">
            Yönetim
          </Link>
          <Link href="/" className="text-sm text-text-muted hover:underline">
            Siteyi gör
          </Link>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-sm text-text-muted">
              {oturum.takmaAd} · {oturum.rol}
            </span>
            <CikisFormu />
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 gap-5 px-4 py-5">
        <aside className="w-48 shrink-0">
          <YanMenu ogeler={roleGoreNav(oturum.rol)} />
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
