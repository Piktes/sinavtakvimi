import { cn } from "@/lib/cn";

// §3.7: uygulamada TEK Skeleton.
// §4.5: iskelet ekranlar GERÇEK DÜZENİN ŞEKLİNDE olmalı — genel gri blok
// değil. Bu yüzden bu bileşen tek başına kullanılmaz; sayfa/kart iskeletleri
// bunu kendi düzenlerinde birleştirir (ör. IlanKartiIskeleti).
export function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("animate-pulse rounded-sm bg-bg-subtle", className)} {...props} />;
}
