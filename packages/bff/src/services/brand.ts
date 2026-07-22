import { TAGS, TTL, withCache } from "@repo/cache";
import type { BrandPage, SearchParams, SortOption } from "@repo/domain";

import { NotFoundError } from "../errors";
import { toImage } from "../support/money";
import * as catalog from "../repositories/catalog.repo";
import { searchProducts } from "./search";

async function build(slug: string, page: number, sort: SortOption): Promise<BrandPage> {
  const brand = await catalog.getBrandBySlug(slug);
  if (!brand) throw new NotFoundError("brand", slug);

  const initial = await searchProducts({ brand: brand.name, page, sort });

  return {
    brand: {
      name: brand.name,
      slug: brand.slug,
      logo: brand.logo_url ? toImage(brand.logo_url, brand.name, 200, 80) : undefined,
    },
    breadcrumbs: [
      { name: "Home", href: "/" },
      { name: "Brands", href: "/brands" },
      { name: brand.name, href: `/brands/${brand.slug}` },
    ],
    featured: initial.items.slice(0, 4),
    initial,
    seo: {
      title: `${brand.name} — Ampere`,
      description: brand.description ?? `Shop ${brand.name} products.`,
      canonical: `/brands/${brand.slug}`,
    },
  };
}

export function getBrandPage(slug: string, params: SearchParams = {}): Promise<BrandPage> {
  const page = params.page ?? 1;
  const sort = params.sort ?? "relevance";
  return withCache(build, {
    keyParts: ["brand"],
    tags: [TAGS.brand(slug), TAGS.collection()],
    revalidate: TTL.fiveMinutes,
  })(slug, page, sort);
}
