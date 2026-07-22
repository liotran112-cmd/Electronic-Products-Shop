/** Reads Shopify config from the environment. Server-only for the Admin token. */
export interface ShopifyEnv {
  storeDomain: string;
  storefrontApiVersion: string;
  storefrontPublicToken: string;
  adminApiVersion: string;
  adminAccessToken: string;
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export function readShopifyEnv(): ShopifyEnv {
  return {
    storeDomain: required("SHOPIFY_STORE_DOMAIN"),
    storefrontApiVersion: process.env.SHOPIFY_STOREFRONT_API_VERSION ?? "2025-01",
    storefrontPublicToken: required("NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN"),
    adminApiVersion: process.env.SHOPIFY_ADMIN_API_VERSION ?? "2025-01",
    // Server-only. Never expose to the browser.
    adminAccessToken: required("SHOPIFY_ADMIN_ACCESS_TOKEN"),
  };
}
