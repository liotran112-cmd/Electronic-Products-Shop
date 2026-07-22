import type { Money } from "@repo/domain";
import { cn } from "@repo/ui";

const SIZES = { sm: "text-base", md: "text-lg", lg: "text-2xl" } as const;

export interface PriceDisplayProps {
  price: Money;
  compareAtPrice?: Money;
  size?: keyof typeof SIZES;
  className?: string;
}

/** Mono, tabular price with optional compare-at strike (B&H clarity). */
export function PriceDisplay({ price, compareAtPrice, size = "md", className }: PriceDisplayProps) {
  const onSale = compareAtPrice != null && compareAtPrice.amount > price.amount;
  return (
    <div className={cn("flex items-baseline gap-2 font-mono tabular-nums", className)}>
      <span className={cn("font-bold tracking-tight", SIZES[size], onSale && "text-primary")}>
        {price.formatted}
      </span>
      {onSale ? (
        <span className="text-sm font-medium text-muted-foreground line-through">
          {compareAtPrice.formatted}
        </span>
      ) : null}
    </div>
  );
}
