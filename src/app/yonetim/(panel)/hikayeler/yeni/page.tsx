import type { Metadata } from "next";
import { requireRol } from "@/lib/rbac";
import { HikayeFormu } from "../hikaye-formu";

export const metadata: Metadata = { title: "Yeni hikaye" };

export default async function YeniHikayeSayfasi() {
  await requireRol(["ADMIN", "EDITOR"]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-baslik text-2xl font-semibold text-text">Yeni hikaye</h1>
      <HikayeFormu />
    </div>
  );
}
