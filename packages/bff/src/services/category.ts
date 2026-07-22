import { TAGS, TTL, withCache } from "@repo/cache";
import type { CategoryPage, SearchParams, SortOption } from "@repo/domain";

import { NotFoundError } from "../errors";
import * as catalog from "../repositories/catalog.repo";
import { searchProducts } from "./search";

/**
 * Cacheable category shell + first (unfiltered) page for SSR/SEO. Interactive
 * facet refinement runs client-side via searchProducts (dynamic), so filters
 * are deliberately NOT part of the cache key — avoids key explosion.
 */
async function build(slug: string, page: number, sort: SortOption): Promise<CategoryPage> {
  const category = await catalog.getCategoryBySlug(slug);
  if (!category) throw new NotFoundError("category", slug);

  const initial = await searchProducts({ category: category.name, page, sort });

  return {
    category: { name: category.name, slug: category.slug },
    breadcrumbs: [
      { name: "Home", href: "/" },
      { name: category.name, href: `/c/${category.slug}` },
    ],
    facets: initial.facets,
    initial,
    seo: {
      title: `${category.name} — Ampere`,
      description: `Browse ${category.name}: parametric search, specs, datasheets.`,
      canonical: `/c/${category.slug}`,
    },
  };
}

export function getCategoryPage(slug: string, params: SearchParams = {}): Promise<CategoryPage> {
  const page = params.page ?? 1;
  const sort = params.sort ?? "relevance";
  return withCache(build, {
    keyParts: ["category"],
    tags: [TAGS.category(slug), TAGS.collection()],
    revalidate: TTL.fiveMinutes,
  })(slug, page, sort);
}
