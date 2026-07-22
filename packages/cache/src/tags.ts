/**
 * Typed cache-tag builders. These are the SAME tags the Phase-2 sync pipeline
 * invalidates (`product:{handle}`, `collection:all`), so a product sync
 * automatically busts exactly the read-side pages that display it.
 */
export const TAGS = {
  homepage: () => "homepage",
  navigation: () => "navigation",
  content: () => "content",
  /** Any product change — invalidates all listing/home pages. */
  collection: () => "collection:all",
  product: (handle: string) => `product:${handle}`,
  category: (slug: string) => `category:${slug}`,
  brand: (slug: string) => `brand:${slug}`,
  recommendations: () => "recs",
} as const;
