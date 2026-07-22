import type { Availability } from "@repo/domain";
import { cn } from "@repo/ui";

const STATUS: Record<Availability, { label: string; dot: string; text: string }> = {
  in_stock: { label: "In stock", dot: "bg-success", text: "text-success" },
  low_stock: { label: "Low stock", dot: "bg-[hsl(var(--warning))]", text: "text-[hsl(var(--warning))]" },
  out_of_stock: { label: "Out of stock", dot: "bg-muted-foreground", text: "text-muted-foreground" },
  backorder: { label: "Backorder", dot: "bg-[hsl(var(--warning))]", text: "text-[hsl(var(--warning))]" },
  preorder: { label: "Pre-order", dot: "bg-primary", text: "text-primary" },
};

export interface StockIndicatorProps {
  availability: Availability;
  count?: number;
  className?: string;
}

/** Status by icon + text (never color alone — WCAG). */
export function StockIndicator({ availability, count, className }: StockIndicatorProps) {
  const s = STATUS[availability];
  const showCount = count != null && availability !== "out_of_stock";
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-sm font-medium", s.text, className)}>
      <span className={cn("size-2 shrink-0 rounded-full", s.dot)} aria-hidden />
      {s.label}
      {showCount ? (
        <span className="font-mono text-xs font-normal text-muted-foreground">
          · {count.toLocaleString("en-US")}
        </span>
      ) : null}
    </span>
  );
}
