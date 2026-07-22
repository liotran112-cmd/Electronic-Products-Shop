"use client";

import { useRouter } from "next/navigation";

import type { SortOption } from "@repo/domain";

import { setSortHref, SORT_OPTIONS, type RawSearchParams } from "../../lib/search-url";

/**
 * Sort control (small client leaf). Navigation is still URL-driven — it pushes
 * the same href the server would render — so state stays in the URL, not React.
 */
export function SortSelect({
  pathname,
  searchParams,
  value,
}: {
  pathname: string;
  searchParams: RawSearchParams;
  value: SortOption;
}) {
  const router = useRouter();

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="whitespace-nowrap text-muted-foreground">Sort by</span>
      <select
        value={value}
        onChange={(e) => router.push(setSortHref(pathname, searchParams, e.target.value as SortOption))}
        className="h-9 rounded-md border bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
