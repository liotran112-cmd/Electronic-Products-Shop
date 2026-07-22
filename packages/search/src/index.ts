export {
  mergeProductRecord,
  toHierarchicalFacet,
  type ProductSearchRecord,
  type ShopifyFacts,
  type SpecFacts,
  type EditorialFacts,
} from "./merge";

export { searchClient, adminClient } from "./client";

/** Algolia index names. Replicas (per §8) are created per sort order. */
export const INDEX = {
  products: "products",
  replicas: {
    priceAsc: "products_price_asc",
    priceDesc: "products_price_desc",
    newest: "products_newest",
    popularity: "products_popularity",
  },
} as const;
