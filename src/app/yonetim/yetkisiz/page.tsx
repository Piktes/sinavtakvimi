import type { Metadata } from "next";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = {
  title: "Yetkisiz erişim",
  robots: { index: false, follow: false },
};

export default function YetkisizSayfasi() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-bg p-4">
      <EmptyState
        ikon={ShieldAlert}
        baslik="Bu sayfaya erişim yetkiniz yok"
        aciklama="Rolünüz bu bölümü görüntülemeye izin vermiyor. Yanlış olduğunu düşünüyorsanız yöneticinize başvurun."
        eylem={
          <Link href="/yonetim" className="text-sm text-text hover:underline">
            Panele dön
          </Link>
        }
        className="max-w-md bg-surface"
      />
    </main>
  );
}
