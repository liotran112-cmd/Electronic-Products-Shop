import { Star } from "lucide-react";

import type { ReviewSummary } from "@repo/domain";
import { cn } from "@repo/ui";

export interface RatingSummaryProps {
  rating: ReviewSummary;
  showCount?: boolean;
  className?: string;
}

/** Star rating with an accessible label; visual stars are decorative. */
export function RatingSummary({ rating, showCount = true, className }: RatingSummaryProps) {
  const rounded = Math.round(rating.average);
  return (
    <span
      className={cn("inline-flex items-center gap-1.5", className)}
      aria-label={`Rated ${rating.average.toFixed(1)} out of 5 from ${rating.count} reviews`}
    >
      <span className="flex" aria-hidden>
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={cn(
              "size-3.5",
              i <= rounded
                ? "fill-[hsl(var(--warning))] text-[hsl(var(--warning))]"
                : "fill-muted text-muted",
            )}
          />
        ))}
      </span>
      <span className="font-mono text-xs text-muted-foreground">
        {rating.average.toFixed(1)}
        {showCount ? ` (${rating.count.toLocaleString("en-US")})` : ""}
      </span>
    </span>
  );
}
