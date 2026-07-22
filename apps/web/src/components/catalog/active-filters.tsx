import Link from "next/link";
import { X } from "lucide-react";

import type { AppliedFilter } from "@repo/domain";

import { clearFiltersHref, toggleFilterHref, type RawSearchParams } from "../../lib/search-url";

/** Removable chips for the currently applied refinements + a clear-all link. */
export function ActiveFilters({
  applied,
  searchParams,
  pathname,
}: {
  applied: AppliedFilter[];
  searchParams: RawSearchParams;
  pathname: string;
}) {
  if (applied.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {applied.map((filter) => (
        <Link
          key={`${filter.attribute}:${filter.value}`}
          href={toggleFilterHref(pathname, searchParams, filter.attribute, filter.value)}
          scroll={false}
          aria-label={`Remove filter ${filter.label}`}
          className="inline-flex items-center gap-1.5 rounded-full border bg-secondary px-3 py-1 text-xs font-medium transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="text-muted-foreground">{filter.label}:</span>
          {filter.value}
          <X className="size-3" aria-hidden />
        </Link>
      ))}
      <Link
        href={clearFiltersHref(pathname, searchParams)}
        scroll={false}
        className="rounded px-2 py-1 text-xs font-medium text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Clear all
      </Link>
    </div>
  );
}
