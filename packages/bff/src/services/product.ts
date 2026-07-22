import { memo, TAGS, TTL, withCache } from "@repo/cache";
import type { LivePricing, ProductDetail } from "@repo/domain";

import { DraftError, GoneError, NotFoundError } from "../errors";
import { toProductDetail } from "../mappers/product.mapper";
import { hitToSummary } from "../mappers/summary.mapper";
import * as catalog from "../repositories/catalog.repo";
import * as commerce from "../repositories/commerce.repo";
import * as content from "../repositories/content.repo";
import * as search from "../repositories/search.repo";
import { availabilityFrom, money } from "../support/money";
import { optional } from "../support/settle";

function categoryLvl1(trail: string[]): string | undefined {
  return trail.length >= 2 ? trail.slice(0, 2).join(" > ") : undefined;
}

async function build(handle: string): Promise<ProductDetail> {
  const core = await catalog.getCatalogProduct(handle); // REQUIRED
  if (!core) throw new NotFoundError("product", handle);
  if (core.status === "draft") throw new DraftError(handle);
  if (core.status === "archived" || core.status === "eol") throw new GoneError(handle);

  // OPTIONAL enhancements — failure degrades a section, never the page.
  const [editorial, related] = await Promise.all([
    optional(content.getProductEditorial(handle), null, "product.editorial"),
    optional(search.relatedHits(handle, categoryLvl1(core.categoryTrail)), [], "product.related"),
  ]);

  return toProductDetail(core, editorial, related.slice(0, 8).map(hitToSummary));
}

/** Cacheable product detail (mirror-first; zero Shopify calls). */
export const getProductPage = memo((handle: string): Promise<ProductDetail> =>
  withCache(build, {
    keyParts: ["product"],
    tags: [TAGS.product(handle)],
    revalidate: TTL.hour,
  })(handle),
);

/** Authoritative live price/stock (Shopify) for the buy box — dynamic, streamed. */
export async function getLivePricing(handle: string): Promise<LivePricing> {
  const variants = await commerce.getLivePricing(handle);
  if (!variants) throw new NotFoundError("pricing", handle);
  return {
    variants: variants.map((v) => ({
      id: v.id,
      price: money(v.price.amount, v.price.currency),
      compareAtPrice: v.compareAtPrice
        ? money(v.compareAtPrice.amount, v.compareAtPrice.currency)
        : undefined,
      availability: availabilityFrom(v.availableForSale, v.quantityAvailable),
      quantityAvailable: v.quantityAvailable,
    })),
    updatedAt: new Date().toISOString(),
  };
}
