import { koleksiyonIcs } from "@/lib/veri/ics";
import { bulunamadi, icsYaniti, slugTemizle } from "@/app/api/ics/yanit";

// §4.7 abone olunabilir akış — koleksiyon filtresi sitedekiyle aynı
// fonksiyondan çözülür (bkz. lib/veri/ics.ts).
export async function GET(_istek: Request, { params }: { params: Promise<{ slug: string }> }) {
  const slug = slugTemizle((await params).slug);
  const govde = await koleksiyonIcs(slug);
  if (!govde) return bulunamadi();
  return icsYaniti(govde, `${slug}.ics`);
}
