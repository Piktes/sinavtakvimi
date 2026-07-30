import { tekIlanIcs } from "@/lib/veri/ics";
import { bulunamadi, icsYaniti, slugTemizle } from "@/app/api/ics/yanit";

// §4.7: tek ilanın .ics indirmesi (OAuth yok).
export async function GET(_istek: Request, { params }: { params: Promise<{ slug: string }> }) {
  const slug = slugTemizle((await params).slug);
  const govde = await tekIlanIcs(slug);
  if (!govde) return bulunamadi();
  return icsYaniti(govde, `${slug}.ics`);
}
