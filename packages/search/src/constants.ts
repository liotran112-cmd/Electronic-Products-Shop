/** Algolia index names. Replicas (SEARCH §1) are created per sort order. */
export const INDEX = {
  products: "products",
  replicas: {
    priceAsc: "products_price_asc",
    priceDesc: "products_price_desc",
    newest: "products_newest",
    popularity: "products_popularity",
  },
} as const;
