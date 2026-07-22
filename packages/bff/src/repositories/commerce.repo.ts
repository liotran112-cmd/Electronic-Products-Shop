import { storefront } from "@repo/shopify";

/**
 * Shopify reads — ONLY authoritative live price/inventory (the buy box). The
 * cacheable page paths deliberately avoid this to survive scale; see §8/§10.
 */

export interface LiveVariant {
  id: string;
  sku: string;
  availableForSale: boolean;
  quantityAvailable: number;
  price: { amount: number; currency: string };
  compareAtPrice: { amount: number; currency: string } | null;
}

interface StorefrontPricingResponse {
  product: {
    variants: {
      nodes: Array<{
        id: string;
        sku: string | null;
        availableForSale: boolean;
        quantityAvailable: number | null;
        price: { amount: string; currencyCode: string };
        compareAtPrice: { amount: string; currencyCode: string } | null;
      }>;
    };
  } | null;
}

const PRICING_QUERY = /* GraphQL */ `
  query LivePricing($handle: String!) {
    product(handle: $handle) {
      variants(first: 100) {
        nodes {
          id
          sku
          availableForSale
          quantityAvailable
          price { amount currencyCode }
          compareAtPrice { amount currencyCode }
        }
      }
    }
  }
`;

export async function getLivePricing(handle: string): Promise<LiveVariant[] | null> {
  const data = await storefront.request<StorefrontPricingResponse>(PRICING_QUERY, { handle });
  const nodes = data.product?.variants.nodes;
  if (!nodes) return null;
  return nodes.map((v) => ({
    id: v.id,
    sku: v.sku ?? "",
    availableForSale: v.availableForSale,
    quantityAvailable: v.quantityAvailable ?? 0,
    price: { amount: Number(v.price.amount), currency: v.price.currencyCode },
    compareAtPrice: v.compareAtPrice
      ? { amount: Number(v.compareAtPrice.amount), currency: v.compareAtPrice.currencyCode }
      : null,
  }));
}

/**
 * Customer orders live in Shopify and require a customer access token flow
 * (wired with the account experience in Phase 3.5). Returns [] until then so
 * the dashboard degrades gracefully rather than failing.
 */
export async function getCustomerOrders(): Promise<never[]> {
  return [];
}
