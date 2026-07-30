import { cn } from "@/lib/cn";

// §3.7: uygulamada TEK Card.
export function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("rounded-md border border-border bg-surface shadow-sm", className)}
      {...props}
    />
  );
}

export function CardBaslik({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-1 p-4", className)} {...props} />;
}

export function CardGovde({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("p-4 pt-0", className)} {...props} />;
}

export function CardAlt({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex items-center gap-2 p-4 pt-0", className)} {...props} />;
}
