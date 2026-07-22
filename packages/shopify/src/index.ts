export { storefront, type StorefrontClient } from "./storefront";
export { admin, type AdminClient } from "./admin";
export {
  fetchProductForSync,
  verifyShopifyWebhook,
  isTrustedShopDomain,
  type ShopifySyncProduct,
  type ShopifySyncVariant,
  type ShopifySyncResult,
} from "./queries";
