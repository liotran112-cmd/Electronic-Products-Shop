/**
 * Record-merge logic for the Algolia `products` index.
 *
 * The Algolia record is a DERIVED read model, assembled from all three sources
 * of truth (SEARCH §2). Any source changing re-triggers this merge via Inngest,
 * so it must be a PURE function of its inputs — no side effects, no I/O.
 */

/** Commerce facts — authored in Shopify. */
export interface ShopifyFacts {
  shopifyProductId: string;
  handle: string;
  title: string;
  vendor: string;
  productType: string;
  status: "active" | "draft" | "archived";
  minPrice: number;
  maxPrice: number;
  currency: string;
  available: boolean;
  imageUrl: string | null;
}

/**
 * One entry of the `products.specs` JSONB projection (migration 0009). Which
 * keys are present depends on the attribute's data_type.
 */
export interface SpecProjectionValue {
  display?: string | string[];
  num?: number;
  base?: number;
  base_high?: number;
  unit?: string;
  values?: string[];
  bool?: boolean;
  text?: string;
}
export type SpecProjection = Record<string, SpecProjectionValue>;

/** Parametric + catalog facts — authored in Supabase (specs projection + taxonomy). */
export interface SpecFacts {
  categoryTrail: string[]; // display names root→leaf; drives the hierarchical facet
  brandName: string | null;
  mpn: string | null;
  sku: string | null;
  ratingAvg: number | null;
  ratingCount: number;
  popularity: number; // PostHog-derived demand signal (nightly batch)
  specs: SpecProjection; // products.specs
}

/** Editorial signal — authored in Sanity. */
export interface EditorialFacts {
  boostedKeywords: string[];
  hasGuide: boolean;
}

/** The flattened record written to Algolia. */
export interface ProductSearchRecord {
  objectID: string;
  handle: string;
  url: string;
  title: string;
  vendor: string;
  mpn: string | null;
  sku: string | null;
  productType: string;
  status: ShopifyFacts["status"];
  published: boolean; // secured-key filter — drafts/archived hidden from shoppers
  price: number;
  priceRange: { min: number; max: number };
  currency: string;
  available: boolean;
  inStockRank: number; // 1 in-stock / 0 out — custom ranking tie-breaker
  imageUrl: string | null;
  categories: { lvl0?: string; lvl1?: string; lvl2?: string; lvl3?: string };
  keywords: string[];
  hasGuide: boolean;
  rating: number | null;
  ratingCount: number;
  popularity: number;
  specsText: string; // searchable free text of all spec displays (recall)
  // typed spec facets are spread in flat as `spec_<key>` for filtering
  [attribute: string]: unknown;
}

/**
 * Build the Algolia hierarchical facet shape (lvl0, "lvl0 > lvl1", …) that
 * InstantSearch's hierarchicalMenu expects, from a root→leaf display path.
 */
export function toHierarchicalFacet(path: string[]): ProductSearchRecord["categories"] {
  const facet: ProductSearchRecord["categories"] = {};
  const levels = ["lvl0", "lvl1", "lvl2", "lvl3"] as const;
  for (let i = 0; i < Math.min(path.length, levels.length); i++) {
    facet[levels[i]!] = path.slice(0, i + 1).join(" > ");
  }
  return facet;
}

/**
 * Turn the specs projection into (a) typed facets for filtering and (b) one
 * searchable text blob. Numeric facets carry the BASE-unit value so `5 V`
 * filters correctly against `3.3 V` regardless of display unit (SEARCH §2).
 */
function flattenSpecs(projection: SpecProjection): {
  facets: Record<string, unknown>;
  text: string;
} {
  const facets: Record<string, unknown> = {};
  const textParts: string[] = [];

  for (const [key, v] of Object.entries(projection)) {
    const display = Array.isArray(v.display) ? v.display.join(" ") : v.display;
    if (display) textParts.push(display);

    if (v.values) {
      facets[`spec_${key}`] = v.values; // multi_enum → OR facet
    } else if (typeof v.base === "number") {
      facets[`spec_${key}`] = v.base; // number / range low
      if (typeof v.base_high === "number") facets[`spec_${key}_high`] = v.base_high;
    } else if (typeof v.num === "number") {
      facets[`spec_${key}`] = v.num; // integer
    } else if (typeof v.bool === "boolean") {
      facets[`spec_${key}`] = v.bool;
    } else if (v.text) {
      facets[`spec_${key}`] = v.text; // enum / text
    }
  }

  return { facets, text: textParts.join(" ") };
}

/** Merge the three sources into a single Algolia record. */
export function mergeProductRecord(
  shopify: ShopifyFacts,
  specs: SpecFacts,
  editorial: EditorialFacts,
): ProductSearchRecord {
  const { facets, text } = flattenSpecs(specs.specs);

  return {
    objectID: shopify.shopifyProductId,
    handle: shopify.handle,
    url: `/products/${shopify.handle}`,
    title: shopify.title,
    vendor: specs.brandName ?? shopify.vendor,
    mpn: specs.mpn,
    sku: specs.sku,
    productType: shopify.productType,
    status: shopify.status,
    published: shopify.status === "active",
    price: shopify.minPrice,
    priceRange: { min: shopify.minPrice, max: shopify.maxPrice },
    currency: shopify.currency,
    available: shopify.available,
    inStockRank: shopify.available ? 1 : 0,
    imageUrl: shopify.imageUrl,
    categories: toHierarchicalFacet(specs.categoryTrail),
    keywords: editorial.boostedKeywords,
    hasGuide: editorial.hasGuide,
    rating: specs.ratingAvg,
    ratingCount: specs.ratingCount,
    popularity: specs.popularity,
    specsText: text,
    ...facets,
  };
}
