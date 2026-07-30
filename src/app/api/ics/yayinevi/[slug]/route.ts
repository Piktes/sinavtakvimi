import { kurumIcs } from "@/lib/veri/ics";
import { bulunamadi, icsYaniti, slugTemizle } from "@/app/api/ics/yanit";

// §4.7 abone olunabilir akış: kullanıcı bir kez ekler, tarih değişince
// takvimi kendiliğinden güncellenir.
export async function GET(_istek: Request, { params }: { params: Promise<{ slug: string }> }) {
  const slug = slugTemizle((await params).slug);
  const govde = await kurumIcs(slug);
  if (!govde) return bulunamadi();
  return icsYaniti(govde, `${slug}.ics`);
}
