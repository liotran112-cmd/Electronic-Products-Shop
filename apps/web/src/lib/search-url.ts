import type { SearchParams, SortOption } from "@repo/domain";

/**
 * Pure, framework-free bridge between the URL query string and the BFF's
 * `SearchParams`. Because facets/sort/pagination live in the URL, the category
 * and search pages render server-side, are crawlable, and work with zero client
 * JS — every filter is a real `<a href>` computed here.
 *
 * URL contract:
 *   ?q=esp32                      → query
 *   &brand=Espressif              → brand
 *   &sort=price_asc               → sort (validated)
 *   &page=2                       → 1-based page (omitted when 1)
 *   &refine=vendor:Espressif      → repeatable list-facet selection ("attr:value")
 *   &range=price:0:50             → repeatable numeric range ("attr:min:max")
 */

export type RawSearchParams = Record<string, string | string[] | undefined>;

export const SORT_OPTIONS: ReadonlyArray<{ value: SortOption; label: string }> = [
  { value: "relevance", label: "Relevance" },
  { value: "popularity", label: "Most popular" },
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];

const SORTS = new Set<SortOption>(SORT_OPTIONS.map((o) => o.value));

function toArray(value: string | string[] | undefined): string[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function firstString(value: string | string[] | undefined): string | undefined {
  const v = toArray(value)[0];
  return v && v.length > 0 ? v : undefined;
}

/** Parse a Next.js `searchParams` object into a typed BFF `SearchParams`. */
export function parseSearchParams(sp: RawSearchParams): SearchParams {
  const query = firstString(sp.q);
  const brand = firstString(sp.brand);

  const sortRaw = firstString(sp.sort);
  const sort = sortRaw && SORTS.has(sortRaw as SortOption) ? (sortRaw as SortOption) : undefined;

  const pageRaw = Number.parseInt(firstString(sp.page) ?? "", 10);
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;

  const filters: Record<string, string[]> = {};
  for (const token of toArray(sp.refine)) {
    const idx = token.indexOf(":");
    if (idx <= 0) continue;
    const attribute = token.slice(0, idx);
    const value = token.slice(idx + 1);
    if (!value) continue;
    (filters[attribute] ??= []).push(value);
  }

  const range: Record<string, [number, number]> = {};
  for (const token of toArray(sp.range)) {
    const [attribute, min, max] = token.split(":");
    const lo = Number(min);
    const hi = Number(max);
    if (attribute && Number.isFinite(lo) && Number.isFinite(hi)) range[attribute] = [lo, hi];
  }

  const params: SearchParams = { page };
  if (query) params.query = query;
  if (brand) params.brand = brand;
  if (sort) params.sort = sort;
  if (Object.keys(filters).length) params.filters = filters;
  if (Object.keys(range).length) params.range = range;
  return params;
}

function toParams(sp: RawSearchParams): URLSearchParams {
  const p = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    for (const v of toArray(value)) p.append(key, v);
  }
  return p;
}

function href(pathname: string, p: URLSearchParams): string {
  const qs = p.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

/** Toggle a list-facet value on/off; resets pagination to page 1. */
export function toggleFilterHref(
  pathname: string,
  sp: RawSearchParams,
  attribute: string,
  value: string,
): string {
  const token = `${attribute}:${value}`;
  const p = toParams(sp);
  const existing = p.getAll("refine");
  p.delete("refine");
  let removed = false;
  for (const t of existing) {
    if (t === token) {
      removed = true;
      continue;
    }
    p.append("refine", t);
  }
  if (!removed) p.append("refine", token);
  p.delete("page");
  return href(pathname, p);
}

export function isFilterActive(sp: RawSearchParams, attribute: string, value: string): boolean {
  return toParams(sp).getAll("refine").includes(`${attribute}:${value}`);
}

/** Change sort; resets pagination. */
export function setSortHref(pathname: string, sp: RawSearchParams, sort: SortOption): string {
  const p = toParams(sp);
  p.delete("sort");
  p.set("sort", sort);
  p.delete("page");
  return href(pathname, p);
}

/** Navigate to a page (page 1 is the canonical bare URL — no `page` param). */
export function pageHref(pathname: string, sp: RawSearchParams, page: number): string {
  const p = toParams(sp);
  p.delete("page");
  if (page > 1) p.set("page", String(page));
  return href(pathname, p);
}

/** Clear all refinements but keep the free-text query and sort. */
export function clearFiltersHref(pathname: string, sp: RawSearchParams): string {
  const p = new URLSearchParams();
  const q = firstString(sp.q);
  const sort = firstString(sp.sort);
  if (q) p.set("q", q);
  if (sort) p.set("sort", sort);
  return href(pathname, p);
}

export function hasActiveRefinements(sp: RawSearchParams): boolean {
  const p = toParams(sp);
  return p.getAll("refine").length > 0 || p.getAll("range").length > 0 || Boolean(firstString(sp.brand));
}
