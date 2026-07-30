import type { Metadata } from "next";
import { TakvimSayfasi } from "@/app/(genel)/takvim/takvim-sayfasi";

export const metadata: Metadata = {
  title: "Takvim",
  description: "Deneme sınavı ilanları — aylık takvim, yayınevi ve formata göre filtreli.",
};

export default async function Takvim({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const parametreler = await searchParams;
  const simdi = new Date();

  return (
    <TakvimSayfasi
      yil={simdi.getUTCFullYear()}
      ay={simdi.getUTCMonth() + 1}
      aramaParametreleri={parametreler}
    />
  );
}
