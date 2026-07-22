import type { Metadata } from "next";
import { Search } from "lucide-react";

import { searchProducts } from "@repo/bff";
import { EmptyState, Pagination } from "@repo/ui";

import { ActiveFilters } from "../../components/catalog/active-filters";
import { FacetSidebar } from "../../components/catalog/facet-sidebar";
import { FiltersDrawer } from "../../components/catalog/filters-drawer";
import { SortSelect } from "../../components/catalog/sort-select";
import { ProductGrid } from "../../components/product/product-grid";
import { NoResults } from "../../components/search/no-results";
import { SearchBox } from "../../components/search/search-box";
import { pageHref, parseSearchParams, type RawSearchParams } from "../../lib/search-url";

interface PageProps {
  searchParams: Promise<RawSearchParams>;
}

export function generateMetadata(): Metadata {
  // Search results are user-specific/infinite — never index them.
  return { title: "Search", robots: { index: false, follow: true } };
}

export default async function SearchPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const parsed = parseSearchParams(sp);
  const query = parsed.query ?? "";
  const pathname = "/search";

  const result = await searchProducts(parsed);
  const hasQuery = query.length > 0;
  const hasResults = result.items.length > 0;
  const sidebar = <FacetSidebar facets={result.facets} searchParams={sp} pathname={pathname} />;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="mx-auto mb-8 max-w-2xl">
        <h1 className="mb-4 text-2xl font-semibold tracking-tight">Search</h1>
        <SearchBox initialQuery={query} />
      </div>

      {!hasQuery ? (
        <EmptyState
          icon={Search}
          title="Search the catalog"
          description="Find products by name, brand, specification, or part number."
        />
      ) : !hasResults ? (
        <NoResults query={query} />
      ) : (
        <div className="grid gap-8 lg:grid-cols-[16rem,1fr]">
          <aside className="hidden lg:block" aria-label="Search filters">
            {sidebar}
          </aside>

          <div className="min-w-0">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <FiltersDrawer count={result.appliedFilters.length}>{sidebar}</FiltersDrawer>
                <p className="text-sm text-muted-foreground" aria-live="polite">
                  {result.pagination.total.toLocaleString("en-US")} results for{" "}
                  <span className="font-medium text-foreground">“{query}”</span>
                </p>
              </div>
              <SortSelect pathname={pathname} searchParams={sp} value={result.sort} />
            </div>

            <ActiveFilters applied={result.appliedFilters} searchParams={sp} pathname={pathname} />

            <div className="mt-4">
              <ProductGrid products={result.items} />
            </div>

            <Pagination
              className="mt-10"
              page={result.pagination.page}
              totalPages={result.pagination.totalPages}
              hrefFor={(p) => pageHref(pathname, sp, p)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
