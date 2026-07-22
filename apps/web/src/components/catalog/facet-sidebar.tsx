import Link from "next/link";
import { Check, ChevronDown } from "lucide-react";

import type { Facet } from "@repo/domain";
import { cn } from "@repo/ui";

import { isFilterActive, toggleFilterHref, type RawSearchParams } from "../../lib/search-url";

/**
 * Faceted navigation (Server Component). Each value is a real <a> whose href is
 * computed from the current URL, so refinement is URL-driven, crawlable, and
 * works with zero client JS. Native <details> gives accessible collapse for free.
 */
export function FacetSidebar({
  facets,
  searchParams,
  pathname,
}: {
  facets: Facet[];
  searchParams: RawSearchParams;
  pathname: string;
}) {
  const visible = facets.filter((f) => f.values.length > 0);
  if (visible.length === 0) return null;

  return (
    <div className="space-y-2" aria-label="Filters">
      {visible.map((facet, index) => (
        <details
          key={facet.attribute}
          open={index < 4}
          className="group rounded-lg border bg-card px-3 py-1"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between py-2 text-sm font-medium">
            {facet.label}
            <ChevronDown
              className="size-4 text-muted-foreground transition-transform group-open:rotate-180"
              aria-hidden
            />
          </summary>
          <ul className="mb-1 space-y-0.5">
            {facet.values.slice(0, 10).map((value) => {
              const active = isFilterActive(searchParams, facet.attribute, value.value);
              return (
                <li key={value.value}>
                  <Link
                    href={toggleFilterHref(pathname, searchParams, facet.attribute, value.value)}
                    scroll={false}
                    aria-label={
                      active
                        ? `Remove filter ${value.label}`
                        : `Filter by ${value.label}, ${value.count} products`
                    }
                    className={cn(
                      "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      active ? "text-foreground" : "text-muted-foreground hover:bg-accent",
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "flex size-4 shrink-0 items-center justify-center rounded border",
                        active ? "border-primary bg-primary text-primary-foreground" : "border-input",
                      )}
                    >
                      {active ? <Check className="size-3" /> : null}
                    </span>
                    <span className="flex-1 truncate">{value.label}</span>
                    <span className="font-mono text-xs tabular-nums text-muted-foreground">
                      {value.count.toLocaleString("en-US")}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </details>
      ))}
    </div>
  );
}
