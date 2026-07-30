import type { Metadata } from "next";
import { requireRol } from "@/lib/rbac";
import { IlanFormu } from "../ilan-formu";
import { formSecenekleri } from "../secenekler";

export const metadata: Metadata = { title: "Yeni ilan" };

export default async function YeniIlanSayfasi() {
  await requireRol(["ADMIN", "EDITOR"]);
  const secenekler = await formSecenekleri();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-baslik text-2xl font-semibold text-text">Yeni ilan</h1>
      <IlanFormu secenekler={secenekler} />
    </div>
  );
}
