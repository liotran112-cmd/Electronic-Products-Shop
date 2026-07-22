/**
 * @repo/bff — the ONLY backend interface the Next.js frontend may use.
 * Every function returns one strongly-typed domain object; no source shapes leak.
 */

// ── Services (the public read API) ───────────────────────────────
export { getHomepage } from "./services/homepage";
export { getNavigation } from "./services/navigation";
export { getCategoryPage } from "./services/category";
export { getBrandPage } from "./services/brand";
export { getProductPage, getLivePricing } from "./services/product";
export { searchProducts } from "./services/search";
export { getRecommendations, getRelatedProducts } from "./services/recommendations";
export { getCustomerDashboard, getRecentlyViewed } from "./services/account";
export { getQuoteDetails } from "./services/quote";

// ── Errors (pages map these to notFound()/error boundaries) ──────
export {
  BffError,
  NotFoundError,
  GoneError,
  DraftError,
  UpstreamError,
  UnauthenticatedError,
  isNotFoundLike,
} from "./errors";

// ── Domain types (re-exported so the app imports one package) ────
export type * from "@repo/domain";
