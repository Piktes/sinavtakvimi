import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Sınıf birleştirme — çakışan Tailwind sınıflarında sonuncusu kazanır.
export function cn(...girdiler: ClassValue[]): string {
  return twMerge(clsx(girdiler));
}
