import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TakvimSayfasi } from "@/app/(genel)/takvim/takvim-sayfasi";
import { TakvimAkisiDugmesi } from "@/components/takvim-akisi-dugmesi";
import { filtreyiWhereCevir, koleksiyonBul } from "@/lib/veri/ilan";

// §4.6: /k/[slug] — üst menü sekmesinin açtığı koleksiyon takvimi.
// Sekmeler admin tanımlı kayıtlı filtrelerdir (§2.2), bu sayfa o filtreyi
// takvim sorgusuna ek kısıt olarak uygular.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const koleksiyon = await koleksiyonBul(slug);
  if (!koleksiyon) return { title: "Koleksiyon bulunamadı" };
  return {
    title: `${koleksiyon.ad} Takvimi`,
    description: `${koleksiyon.ad} deneme sınavı ilanları — tarih, yayınevi ve format bilgileri.`,
  };
}

export default async function KoleksiyonSayfasi({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ slug }, parametreler] = await Promise.all([params, searchParams]);
  const koleksiyon = await koleksiyonBul(slug);
  if (!koleksiyon) notFound();

  const simdi = new Date();

  return (
    <TakvimSayfasi
      yil={simdi.getUTCFullYear()}
      ay={simdi.getUTCMonth() + 1}
      aramaParametreleri={parametreler}
      ekFiltre={filtreyiWhereCevir(koleksiyon.filtre)}
      baslik={koleksiyon.ad}
      // §4.7: koleksiyonun abone olunabilir akışı — akış, sayfadakiyle
      // aynı filtre çevirisini kullanır (lib/veri/ics.ts).
      baslikEylemi={
        <TakvimAkisiDugmesi akisUrl={`/api/ics/koleksiyon/${slug}.ics`} ad={koleksiyon.ad} />
      }
    />
  );
}
