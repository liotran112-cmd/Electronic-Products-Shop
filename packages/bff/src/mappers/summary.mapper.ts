import type { ProductSummary } from "@repo/domain";

import type { SummaryRow } from "../repositories/catalog.repo";
import type { AlgoliaHit } from "../repositories/search.repo";
import { availabilityFrom, money, toImage } from "../support/money";
import { toKeySpecs } from "./specs.mapper";

/** Algolia hit → card. Algolia is the source of truth for search/listing cards. */
export function hitToSummary(hit: AlgoliaHit): ProductSummary {
  return {
    id: hit.objectID,
    handle: hit.handle,
    href: hit.url || `/products/${hit.handle}`,
    title: hit.title,
    brand: hit.vendor,
    image: hit.image ? toImage(hit.image, hit.title) : null,
    price: money(hit.price, hit.currency),
    availability: hit.available ? "in_stock" : "out_of_stock",
    rating:
      hit.ratingCount && hit.ratingCount > 0
        ? { average: hit.rating ?? 0, count: hit.ratingCount }
        : undefined,
    keySpecs: [],
  };
}

/** Supabase summary row → card (saved products, recently viewed). */
export function rowToSummary(row: SummaryRow): ProductSummary {
  return {
    id: row.id,
    handle: row.handle,
    href: `/products/${row.handle}`,
    title: row.title,
    brand: row.brand,
    image: row.heroImageUrl ? toImage(row.heroImageUrl, row.title) : null,
    price: money(row.price, row.currency),
    availability: availabilityFrom(row.price != null),
    rating: row.ratingCount > 0 ? { average: row.ratingAvg ?? 0, count: row.ratingCount } : undefined,
    keySpecs: toKeySpecs(row.specs),
  };
}
