import type { Metadata } from "next";
import { requireRol } from "@/lib/rbac";
import { KoleksiyonFormu } from "../koleksiyon-formu";
import { filtreSecenekleriGetir } from "../secenekler";

export const metadata: Metadata = { title: "Yeni koleksiyon" };

export default async function YeniKoleksiyonSayfasi() {
  await requireRol(["ADMIN", "EDITOR"]);
  const secenekler = await filtreSecenekleriGetir();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-baslik text-2xl font-semibold text-text">Yeni koleksiyon</h1>
      <KoleksiyonFormu secenekler={secenekler} />
    </div>
  );
}
