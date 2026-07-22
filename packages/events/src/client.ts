import { EventSchemas, Inngest } from "inngest";

/**
 * Typed event catalog for the sync pipeline. Every cross-system propagation
 * flows through these events so it is durable, retryable and idempotent (§1.5).
 */
type Events = {
  "shopify/product.updated": { data: { shopifyProductId: string; correlationId?: string } };
  "shopify/product.deleted": { data: { shopifyProductId: string; correlationId?: string } };
  "sanity/document.published": { data: { documentId: string; type: string; correlationId?: string } };
  "supabase/specs.updated": { data: { productId: string; correlationId?: string } };
  "quote/created": { data: { quoteId: string; reference: string; correlationId?: string } };
};

export const inngest = new Inngest({
  id: "electronics-commerce",
  schemas: new EventSchemas().fromRecord<Events>(),
});

export type { Events };
