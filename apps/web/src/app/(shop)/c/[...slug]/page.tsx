import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getCategoryPage, isNotFoundLike, searchProducts, type SearchResult } from "@repo/bff";

import { ActiveFilters } from "../../../../components/catalog/active-filters";
import { FacetSidebar } from "../../../../components/catalog/facet-sidebar";
import { FiltersDrawer } from "../../../../components/catalog/filters-drawer";
import { SortSelect } from "../../../../components/catalog/sort-select";
import { Breadcrumbs } from "../../../../components/layout/breadcrumbs";
import { ProductGrid } from "../../../../components/product/product-grid";
import { RichText } from "../../../../components/rich-text";
import {
  hasActiveRefinements,
  pageHref,
  parseSearchParams,
  type RawSearchParams,
} from "../../../../lib/search-url";
import { Pagination } from "@repo/ui";

interface PageProps {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<RawSearchParams>;
}

async function loadCategory(slug: string, page: number, sort: ReturnType<typeof parseSearchParams>["sort"]) {
  try {
    return await getCategoryPage(slug, { page, sort });
  } catch (error) {
    if (isNotFoundLike(error)) notFound();
    throw error;
  }
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const sp = await searchParams;
  const parsed = parseSearchParams(sp);
  try {
    const data = await getCategoryPage(slug.join("/"), { page: parsed.page, sort: parsed.sort });
    return {
      title: data.seo.title,
      description: data.seo.description,
      // Refined/paged views are canonicalised to the base category to avoid dupes.
      alternates: { canonical: data.seo.canonical },
      robots: hasActiveRefinements(sp) ? { index: false, follow: true } : undefined,
    };
  } catch {
    return { title: "Category not found", robots: { index: false, follow: false } };
  }
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const parsed = parseSearchParams(sp);
  const slugPath = slug.join("/");
  const pathname = `/c/${slugPath}`;

  const data = await loadCategory(slugPath, parsed.page ?? 1, parsed.sort);

  // Cached shell gives the unfiltered first page; refine server-side only when
  // the URL carries filters/search (keeps the common path a single cached read).
  const result: SearchResult =
    hasActiveRefinements(sp) || parsed.query
      ? await searchProducts({ ...parsed, category: data.category.name })
      : data.initial;

  const sidebar = <FacetSidebar facets={result.facets} searchParams={sp} pathname={pathname} />;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <Breadcrumbs items={data.breadcrumbs} className="mb-4" />

      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{data.category.name}</h1>
        {data.category.description ? (
          <RichText value={data.category.description} className="mt-2 max-w-2xl" />
        ) : null}
      </header>

      <div className="grid gap-8 lg:grid-cols-[16rem,1fr]">
        <aside className="hidden lg:block" aria-label="Product filters">
          {sidebar}
        </aside>

        <div className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <FiltersDrawer count={result.appliedFilters.length}>{sidebar}</FiltersDrawer>
              <p className="text-sm text-muted-foreground" aria-live="polite">
                {result.pagination.total.toLocaleString("en-US")} products
              </p>
            </div>
            <SortSelect pathname={pathname} searchParams={sp} value={result.sort} />
          </div>

          <ActiveFilters applied={result.appliedFilters} searchParams={sp} pathname={pathname} />

          <div className="mt-4">
            <ProductGrid
              products={result.items}
              emptyTitle="No products match these filters"
              emptyDescription="Try removing a filter or broadening your search."
            />
          </div>

          <Pagination
            className="mt-10"
            page={result.pagination.page}
            totalPages={result.pagination.totalPages}
            hrefFor={(p) => pageHref(pathname, sp, p)}
          />
        </div>
      </div>
    </div>
  );
}
