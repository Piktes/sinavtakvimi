import type { Metadata } from "next";
import { requireRol } from "@/lib/rbac";
import { formSecenekleri } from "../secenekler";
import { TopluFormu } from "./toplu-formu";

export const metadata: Metadata = { title: "Toplu seri girişi" };

export default async function TopluSeriSayfasi() {
  await requireRol(["ADMIN", "EDITOR"]);
  const secenekler = await formSecenekleri();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="font-baslik text-2xl font-semibold text-text">Toplu seri girişi</h1>
        <p className="text-sm text-text-muted">
          Bir serinin sezonluk tarihlerini tek ekranda girin — ortak alanlar bir kez.
        </p>
      </div>
      <TopluFormu secenekler={secenekler} />
    </div>
  );
}
