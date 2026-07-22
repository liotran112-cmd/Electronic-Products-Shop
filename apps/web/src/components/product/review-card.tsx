import { BadgeCheck } from "lucide-react";

import { cn } from "@repo/ui";

import { RatingSummary } from "./rating-summary";

export interface Review {
  author: string;
  rating: number;
  title?: string;
  body: string;
  verified?: boolean;
  date?: string;
}

export function ReviewCard({ review, className }: { review: Review; className?: string }) {
  return (
    <article className={cn("rounded-lg border p-4", className)}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <RatingSummary rating={{ average: review.rating, count: 0 }} showCount={false} />
        {review.date ? (
          <time className="font-mono text-xs text-muted-foreground">{review.date}</time>
        ) : null}
      </div>
      {review.title ? <h4 className="text-sm font-semibold">{review.title}</h4> : null}
      <p className="mt-1 text-sm text-muted-foreground">{review.body}</p>
      <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">{review.author}</span>
        {review.verified ? (
          <span className="inline-flex items-center gap-0.5 text-success">
            <BadgeCheck className="size-3.5" aria-hidden />
            Verified purchase
          </span>
        ) : null}
      </p>
    </article>
  );
}
