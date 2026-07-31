import type { Metadata } from "next";
import {
  Archivo,
  Archivo_Black,
  Bricolage_Grotesque,
  IBM_Plex_Mono,
  IBM_Plex_Sans,
  Inter,
  JetBrains_Mono,
  Source_Sans_3,
  Space_Grotesk,
} from "next/font/google";
import "./globals.css";
import { seciliTema, varsayilanTema } from "@/lib/tercihler";
import { aktifVersiyon } from "@/lib/versiyon";

// §5: üç versiyonun yazı tipleri. Yalnızca aktif versiyonun sınıfı <html>'e
// uygulanır — kullanılmayan aileler render edilen metinde geçmediği için
// tarayıcı indirmez (§7 performans). next/font ile self-host.
const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin", "latin-ext"],
  weight: ["600", "700"],
});
const inter = Inter({ variable: "--font-inter", subsets: ["latin", "latin-ext"] });
const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin", "latin-ext"],
});

const archivoBlack = Archivo_Black({
  variable: "--font-archivo-black",
  subsets: ["latin", "latin-ext"],
  weight: "400",
});
const archivo = Archivo({ variable: "--font-archivo", subsets: ["latin", "latin-ext"] });
const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin", "latin-ext"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin", "latin-ext"],
});
const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
});
const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500"],
});

const VERSIYON_YAZILARI = {
  v1: [bricolage.variable, inter.variable, jetbrains.variable],
  v2: [archivoBlack.variable, archivo.variable, sourceSans.variable, jetbrains.variable],
  v3: [spaceGrotesk.variable, plexSans.variable, plexMono.variable],
} as const;

export const metadata: Metadata = {
  title: {
    default: "Sınav Takvimi",
    template: "%s · Sınav Takvimi",
  },
  description:
    "Yayınevi ve eğitim kurumlarının deneme sınavı ilanları — takvim üzerinde takip et, bildirim al.",
};

export default async function KokDuzen({ children }: Readonly<{ children: React.ReactNode }>) {
  // §4.5: tema çerezden okunur ve SSR'da <html> üzerine yazılır — geçişte
  // sıçrama olmaz (kabul kriteri #12). Çerez yoksa `varsayilanTema` devreye
  // girer — sistem tercihine (prefers-color-scheme) bakılmaz, açılış her
  // zaman öngörülebilir tek bir görünümdür (açık).
  const [tema, versiyon] = await Promise.all([seciliTema(), aktifVersiyon()]);
  const efektifTema = tema ?? varsayilanTema();

  return (
    <html
      lang="tr"
      data-versiyon={versiyon}
      data-tema={efektifTema}
      className={`${VERSIYON_YAZILARI[versiyon].join(" ")} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
