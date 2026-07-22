import Link from "next/link";
import { SearchX } from "lucide-react";

import { getNavigation } from "@repo/bff";

import { EmptyState } from "@repo/ui";

/**
 * Zero-result state with recovery. Suggestion links come from the BFF navigation
 * (never hardcoded), so "try these categories" reflects the real taxonomy.
 */
export async function NoResults({ query }: { query: string }) {
  let suggestions: { label: string; href: string }[] = [];
  try {
    const nav = await getNavigation();
    suggestions = nav.primary.slice(0, 6);
  } catch {
    suggestions = [];
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <EmptyState
        icon={SearchX}
        title={`No results for “${query}”`}
        description="Check your spelling, try fewer or more general terms, or search by part number."
      />
      {suggestions.length > 0 ? (
        <div className="text-center">
          <p className="mb-3 text-sm font-medium text-muted-foreground">Browse popular categories</p>
          <ul className="flex flex-wrap justify-center gap-2">
            {suggestions.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="inline-flex rounded-full border bg-card px-4 py-1.5 text-sm transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
