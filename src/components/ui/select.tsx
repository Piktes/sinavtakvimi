import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

// §3.7: uygulamada TEK Select. Native <select> üzerine kurulu — klavye
// gezinmesi ve mobil davranış tarayıcıdan gelir (§7 erişilebilirlik).
export function Select({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <div className="relative inline-flex w-full items-center">
      <select
        className={cn(
          "h-9 w-full appearance-none rounded-md border border-border bg-surface pl-3 pr-8 text-sm text-text transition-colors hover:bg-surface-hover disabled:opacity-50",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden
        size={16}
        strokeWidth={1.75}
        className="pointer-events-none absolute right-2 text-text-faint"
      />
    </div>
  );
}
