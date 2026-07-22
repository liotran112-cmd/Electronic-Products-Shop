/**
 * Record-merge logic for the Algolia `products` index.
 *
 * The Algolia record is a DERIVED read model, assembled from all three sources
 * of truth (§8). Any source changing re-triggers this merge via Inngest, so it
 * must be a pure function of its inputs — no side effects, no I/O.
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

/** Parametric facts — authored in Supabase (specs + taxonomy). */
export interface SpecFacts {
  categoryPath: string[]; // ltree expanded, drives the hierarchical facet
  /** filterable attribute values keyed by attribute_definitions.key */
  attributes: Record<string, string | number | boolean>;
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
  title: string;
  vendor: string;
  productType: string;
  status: ShopifyFacts["status"];
  price: number;
  priceRange: { min: number; max: number };
  currency: string;
  available: boolean;
  imageUrl: string | null;
  categories: {
    lvl0?: string;
    lvl1?: string;
    lvl2?: string;
    lvl3?: string;
  };
  keywords: string[];
  hasGuide: boolean;
  // parametric facets are spread in flat for numeric-range / refinement filtering
  [attribute: string]: unknown;
}

/**
 * Build the Algolia hierarchical facet shape (lvl0, lvl0 > lvl1, ...) that
 * InstantSearch's hierarchicalMenu expects, from an ltree-expanded path.
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
 * Merge the three sources into a single Algolia record. Attribute keys are
 * prefixed (`attr_`) to keep them from colliding with reserved top-level fields.
 */
export function mergeProductRecord(
  shopify: ShopifyFacts,
  specs: SpecFacts,
  editorial: EditorialFacts,
): ProductSearchRecord {
  const record: ProductSearchRecord = {
    objectID: shopify.shopifyProductId,
    handle: shopify.handle,
    title: shopify.title,
    vendor: shopify.vendor,
    productType: shopify.productType,
    status: shopify.status,
    price: shopify.minPrice,
    priceRange: { min: shopify.minPrice, max: shopify.maxPrice },
    currency: shopify.currency,
    available: shopify.available,
    imageUrl: shopify.imageUrl,
    categories: toHierarchicalFacet(specs.categoryPath),
    keywords: editorial.boostedKeywords,
    hasGuide: editorial.hasGuide,
  };

  for (const [key, value] of Object.entries(specs.attributes)) {
    record[`attr_${key}`] = value;
  }

  return record;
}
