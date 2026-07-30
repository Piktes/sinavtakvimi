import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

// §3.7: uygulamada TEK Button. Varyasyon prop ile yapılır, kopya bileşenle değil.
const butonVaryantlari = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-md border border-transparent font-medium whitespace-nowrap transition-colors disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      varyant: {
        birincil: "bg-primary text-primary-fg hover:bg-primary-hover",
        ikincil: "border-border bg-surface text-text hover:bg-surface-hover",
        hayalet: "text-text hover:bg-surface-hover",
        vurgu: "bg-accent text-accent-fg hover:opacity-90",
        tehlike: "bg-danger-bg text-danger hover:opacity-80",
        bag: "text-text underline-offset-4 hover:underline",
      },
      // Yükseklikler boşluk ölçeğinden DEĞİL, kontrol ölçeğinden gelir.
      // `h-7` gibi çıplak Tailwind basamakları burada kullanılamaz: proje
      // `--spacing-1..8`i semantik bir ramp'e bağlamış (7 = 48px), 9 ve 11
      // ise varsayılanda kalmıştı — sm(48px) > lg(44px) oluyordu.
      boyut: {
        sm: "h-kontrol-sm px-3 text-xs",
        md: "h-kontrol-md px-4 text-sm",
        lg: "h-kontrol-lg px-5 text-base",
        ikon: "h-kontrol-md w-kontrol-md",
        ikonSm: "h-kontrol-sm w-kontrol-sm",
      },
    },
    defaultVariants: { varyant: "birincil", boyut: "md" },
  },
);

export type ButtonProps = React.ComponentProps<"button"> & VariantProps<typeof butonVaryantlari>;

export function Button({ className, varyant, boyut, ...props }: ButtonProps) {
  return <button className={cn(butonVaryantlari({ varyant, boyut }), className)} {...props} />;
}

export { butonVaryantlari };
