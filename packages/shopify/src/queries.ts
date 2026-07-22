import { createHmac, timingSafeEqual } from "node:crypto";

import { admin } from "./admin";

/** Commerce facts for one product (field names align with search's ShopifyFacts). */
export interface ShopifySyncProduct {
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

export interface ShopifySyncVariant {
  shopifyVariantId: string;
  sku: string;
  title: string | null;
  optionValues: Record<string, string>;
  price: number;
  currency: string;
  position: number;
}

export interface ShopifySyncResult {
  product: ShopifySyncProduct;
  variants: ShopifySyncVariant[];
}

interface AdminProductResponse {
  product: {
    id: string;
    handle: string;
    title: string;
    vendor: string;
    productType: string;
    status: "ACTIVE" | "ARCHIVED" | "DRAFT";
    totalInventory: number;
    featuredImage: { url: string } | null;
    priceRangeV2: {
      minVariantPrice: { amount: string; currencyCode: string };
      maxVariantPrice: { amount: string };
    };
    variants: {
      nodes: Array<{
        id: string;
        sku: string | null;
        title: string | null;
        price: string;
        inventoryQuantity: number | null;
        selectedOptions: Array<{ name: string; value: string }>;
      }>;
    };
  } | null;
}

const SYNC_QUERY = /* GraphQL */ `
  query ProductForSync($id: ID!) {
    product(id: $id) {
      id
      handle
      title
      vendor
      productType
      status
      totalInventory
      featuredImage { url }
      priceRangeV2 {
        minVariantPrice { amount currencyCode }
        maxVariantPrice { amount }
      }
      variants(first: 100) {
        nodes { id sku title price inventoryQuantity selectedOptions { name value } }
      }
    }
  }
`;

const STATUS_MAP = { ACTIVE: "active", ARCHIVED: "archived", DRAFT: "draft" } as const;

/**
 * Fetch a product (incl. drafts) from the Admin API and normalize it for sync.
 * Returns `null` when the product no longer exists (e.g. deleted between a
 * webhook firing and being processed) so the caller skips instead of failing.
 */
export async function fetchProductForSync(
  shopifyProductId: string,
): Promise<ShopifySyncResult | null> {
  const data = await admin.request<AdminProductResponse>(SYNC_QUERY, { id: shopifyProductId });
  const p = data.product;
  if (!p) return null;

  const currency = p.priceRangeV2.minVariantPrice.currencyCode;
  const variantNodes = p.variants.nodes;
  const available =
    p.totalInventory > 0 || variantNodes.some((v) => (v.inventoryQuantity ?? 0) > 0);

  const product: ShopifySyncProduct = {
    shopifyProductId: p.id,
    handle: p.handle,
    title: p.title,
    vendor: p.vendor,
    productType: p.productType,
    status: STATUS_MAP[p.status],
    minPrice: Number(p.priceRangeV2.minVariantPrice.amount),
    maxPrice: Number(p.priceRangeV2.maxVariantPrice.amount),
    currency,
    available,
    imageUrl: p.featuredImage?.url ?? null,
  };

  const variants: ShopifySyncVariant[] = variantNodes.map((v, i) => ({
    shopifyVariantId: v.id,
    sku: v.sku ?? "",
    title: v.title,
    optionValues: Object.fromEntries(v.selectedOptions.map((o) => [o.name, o.value])),
    price: Number(v.price),
    currency,
    position: i,
  }));

  return { product, variants };
}

/**
 * Verify a Shopify webhook HMAC (base64 SHA-256 of the raw body). Timing-safe.
 * MUST run on the raw request body before any JSON parsing. Rejects an empty
 * secret or header defensively.
 */
export function verifyShopifyWebhook(rawBody: string, hmacHeader: string, secret: string): boolean {
  if (!secret || !hmacHeader) return false;
  const digest = createHmac("sha256", secret).update(rawBody, "utf8").digest("base64");
  const a = Buffer.from(digest);
  const b = Buffer.from(hmacHeader);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Guard against spoofed shops: the X-Shopify-Shop-Domain must match ours. */
export function isTrustedShopDomain(shopDomain: string | null, expectedDomain: string): boolean {
  return shopDomain !== null && shopDomain.toLowerCase() === expectedDomain.toLowerCase();
}
