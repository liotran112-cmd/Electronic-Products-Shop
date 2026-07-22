/**
 * Shared, isomorphic analytics contract (PostHog). Event names live here so the
 * browser and server emit the same strings — the funnels in PRODUCT-PAGE §7 and
 * CUSTOM-DEVICE §4 depend on consistent naming.
 */
export const ANALYTICS_EVENTS = {
  productViewed: "product_viewed",
  addToCart: "add_to_cart",
  datasheetDownloaded: "datasheet_downloaded",
  addToCompare: "add_to_compare",
  searchPerformed: "search_performed",
  quoteConfigureStarted: "quote_configure_started",
  quoteSubmitted: "quote_submitted",
} as const;

export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];
