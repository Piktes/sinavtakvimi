import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

// §3.7: uygulamada TEK Badge.
const rozetVaryantlari = cva(
  "inline-flex w-fit shrink-0 items-center gap-1 rounded-sm border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap",
  {
    variants: {
      varyant: {
        notr: "bg-bg-subtle text-text-muted",
        cizgi: "border-border text-text-muted",
        basari: "bg-success-bg text-success",
        uyari: "bg-warning-bg text-warning",
        tehlike: "bg-danger-bg text-danger",
        vurgu: "bg-accent text-accent-fg",
      },
    },
    defaultVariants: { varyant: "notr" },
  },
);

export type BadgeProps = React.ComponentProps<"span"> & VariantProps<typeof rozetVaryantlari>;

export function Badge({ className, varyant, ...props }: BadgeProps) {
  return <span className={cn(rozetVaryantlari({ varyant }), className)} {...props} />;
}

export { rozetVaryantlari };
