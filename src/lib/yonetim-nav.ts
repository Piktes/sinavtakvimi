import type { PanelRolu } from "@/auth";

export interface NavOgesi {
  href: string;
  etiket: string;
  roller: readonly PanelRolu[];
  // Henüz yazılmamış ekranlar menüde görünür ama devre dışıdır — §8'deki
  // sıraya göre hangi adımda geleceği not düşülür.
  hazir: boolean;
  not?: string;
}

// §6 modül listesi. Yan menü buradan üretilir ve role göre filtrelenir.
export const YONETIM_NAV: NavOgesi[] = [
  {
    href: "/yonetim",
    etiket: "Gösterge paneli",
    roller: ["ADMIN", "EDITOR", "MODERATOR"],
    hazir: true,
  },
  { href: "/yonetim/ilanlar", etiket: "İlanlar", roller: ["ADMIN", "EDITOR"], hazir: true },
  { href: "/yonetim/kurumlar", etiket: "Kurumlar", roller: ["ADMIN", "EDITOR"], hazir: true },
  {
    href: "/yonetim/kurum-tipleri",
    etiket: "Kurum tipleri",
    roller: ["ADMIN", "EDITOR"],
    hazir: true,
  },
  { href: "/yonetim/etiketler", etiket: "Etiketler", roller: ["ADMIN", "EDITOR"], hazir: true },
  {
    href: "/yonetim/koleksiyonlar",
    etiket: "Koleksiyonlar",
    roller: ["ADMIN", "EDITOR"],
    hazir: true,
  },
  {
    href: "/yonetim/takvim-notlari",
    etiket: "Takvim notları",
    roller: ["ADMIN", "EDITOR"],
    hazir: true,
  },
  {
    href: "/yonetim/yorumlar",
    etiket: "Yorumlar",
    roller: ["ADMIN", "MODERATOR"],
    hazir: true,
  },
  {
    href: "/yonetim/kullanicilar",
    etiket: "Kullanıcılar",
    roller: ["ADMIN"],
    hazir: false,
    not: "Adım 10",
  },
  {
    href: "/yonetim/sistem",
    etiket: "Sistem",
    roller: ["ADMIN"],
    hazir: false,
    not: "Adım 10",
  },
];

export function roleGoreNav(rol: PanelRolu): NavOgesi[] {
  return YONETIM_NAV.filter((oge) => oge.roller.includes(rol));
}
