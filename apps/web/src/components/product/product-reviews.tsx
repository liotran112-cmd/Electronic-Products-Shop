import { Star } from "lucide-react";

import type { ReviewSummary } from "@repo/domain";
import { EmptyState } from "@repo/ui";

import { RatingSummary } from "./rating-summary";

const ROWS = [5, 4, 3, 2, 1] as const;

/**
 * Aggregate review panel. Individual review bodies are owned by the reviews app
 * (integrated in a later phase); the BFF exposes the summary + distribution,
 * which is what drives the rating signal and JSON-LD aggregateRating.
 */
export function ProductReviews({ reviews }: { reviews: ReviewSummary }) {
  if (reviews.count === 0) {
    return (
      <EmptyState
        icon={Star}
        title="No reviews yet"
        description="This product hasn't been reviewed. Be the first once you've tried it."
      />
    );
  }

  const distribution = reviews.distribution;

  return (
    <div className="grid gap-6 sm:grid-cols-[auto,1fr] sm:items-center">
      <div className="flex flex-col items-center gap-1 rounded-xl border bg-card p-6 text-center">
        <span className="font-mono text-4xl font-bold tabular-nums">{reviews.average.toFixed(1)}</span>
        <RatingSummary rating={reviews} showCount={false} />
        <span className="text-xs text-muted-foreground">
          {reviews.count.toLocaleString("en-US")} reviews
        </span>
      </div>

      {distribution ? (
        <dl className="flex flex-col gap-1.5">
          {ROWS.map((star) => {
            const value = distribution[star] ?? 0;
            const pct = reviews.count > 0 ? Math.round((value / reviews.count) * 100) : 0;
            return (
              <div key={star} className="flex items-center gap-3 text-sm">
                <dt className="flex w-12 shrink-0 items-center gap-1 text-muted-foreground">
                  {star}
                  <Star className="size-3.5 fill-[hsl(var(--warning))] text-[hsl(var(--warning))]" aria-hidden />
                </dt>
                <div
                  className="h-2 flex-1 overflow-hidden rounded-full bg-muted"
                  role="meter"
                  aria-valuenow={pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${star} star: ${pct}%`}
                >
                  <div className="h-full rounded-full bg-[hsl(var(--warning))]" style={{ width: `${pct}%` }} />
                </div>
                <dd className="w-10 shrink-0 text-right font-mono text-xs tabular-nums text-muted-foreground">
                  {pct}%
                </dd>
              </div>
            );
          })}
        </dl>
      ) : null}
    </div>
  );
}
