import type { Metadata } from "next";
import { Bricolage_Grotesque, Inter, JetBrains_Mono } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";

// §5 V1 "Ajanda": Başlık Bricolage Grotesque 700 sıkı · Gövde Inter ·
// Sayısal JetBrains Mono. §7: next/font ile self-host.
const yaziBaslik = Bricolage_Grotesque({
  variable: "--yazi-baslik",
  subsets: ["latin", "latin-ext"],
  weight: ["600", "700"],
});

const yaziGovde = Inter({
  variable: "--yazi-govde",
  subsets: ["latin", "latin-ext"],
});

const yaziMono = JetBrains_Mono({
  variable: "--yazi-mono",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: {
    default: "Sınav İlan Platformu",
    template: "%s · Sınav İlan Platformu",
  },
  description:
    "Yayınevi ve eğitim kurumlarının deneme sınavı ilanları — takvim üzerinde takip et, bildirim al.",
};

export default async function KokDuzen({ children }: Readonly<{ children: React.ReactNode }>) {
  // §4.5: tema çerezden okunur ve SSR'da <html> üzerine yazılır — geçişte
  // sıçrama olmaz (kabul kriteri #12). Çerez yoksa öznitelik hiç basılmaz,
  // böylece CSS `prefers-color-scheme` devreye girer.
  const cerezler = await cookies();
  const tema = cerezler.get("tema")?.value;
  const temaOzniteligi = tema === "acik" || tema === "koyu" ? tema : undefined;

  return (
    <html
      lang="tr"
      data-tema={temaOzniteligi}
      className={`${yaziBaslik.variable} ${yaziGovde.variable} ${yaziMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
