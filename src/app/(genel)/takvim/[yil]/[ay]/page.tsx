import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TakvimSayfasi } from "@/app/(genel)/takvim/takvim-sayfasi";
import { formatAyYil } from "@/lib/tarih";

// §4.6: derin bağlantı — /takvim/[yil]/[ay]. Paylaşılabilir ve SEO'ya hizmet eder.
function parcalariCoz(yilHam: string, ayHam: string) {
  const yil = Number(yilHam);
  const ay = Number(ayHam);
  if (!Number.isInteger(yil) || !Number.isInteger(ay)) return null;
  if (yil < 2000 || yil > 2100 || ay < 1 || ay > 12) return null;
  return { yil, ay };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ yil: string; ay: string }>;
}): Promise<Metadata> {
  const { yil, ay } = await params;
  const cozulen = parcalariCoz(yil, ay);
  if (!cozulen) return { title: "Takvim" };
  return { title: `${formatAyYil(cozulen.yil, cozulen.ay)} Sınav Takvimi` };
}

export default async function AylikTakvim({
  params,
  searchParams,
}: {
  params: Promise<{ yil: string; ay: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ yil, ay }, parametreler] = await Promise.all([params, searchParams]);
  const cozulen = parcalariCoz(yil, ay);
  if (!cozulen) notFound();

  return <TakvimSayfasi yil={cozulen.yil} ay={cozulen.ay} aramaParametreleri={parametreler} />;
}
