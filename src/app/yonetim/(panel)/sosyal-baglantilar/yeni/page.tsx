import type { Metadata } from "next";
import { requireRol } from "@/lib/rbac";
import { SosyalBaglantiFormu } from "../sosyal-baglanti-formu";

export const metadata: Metadata = { title: "Yeni sosyal bağlantı" };

export default async function YeniSosyalBaglantiSayfasi() {
  await requireRol(["ADMIN", "EDITOR"]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-baslik text-2xl font-semibold text-text">Yeni sosyal bağlantı</h1>
      <SosyalBaglantiFormu />
    </div>
  );
}
