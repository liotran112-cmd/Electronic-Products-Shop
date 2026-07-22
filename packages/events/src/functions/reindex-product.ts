import { inngest } from "../client";

/**
 * Re-merge and reindex a product's Algolia record whenever any source of truth
 * changes (§4.1). The Algolia record is assembled from Shopify + Supabase +
 * Sanity, so all three triggering events fan into this one function.
 *
 * The step bodies are stubbed for the Phase 1 scaffold; Phase 2 wires the real
 * Shopify fetch, Supabase mirror upsert, record-merge and revalidateTag calls.
 */
export const reindexProduct = inngest.createFunction(
  {
    id: "reindex-product",
    // idempotency + at-least-once safety: collapse rapid duplicate events
    idempotency: "event.data.shopifyProductId",
    retries: 4,
  },
  [
    { event: "shopify/product.updated" },
    { event: "supabase/specs.updated" },
    { event: "sanity/document.published" },
  ],
  async ({ step }) => {
    const product = await step.run("fetch-product", async () => {
      // TODO(phase-2): fetch full product via Storefront/Admin GraphQL
      return { ok: true };
    });

    await step.run("upsert-mirror", async () => {
      // TODO(phase-2): upsert products + product_variants mirror in Supabase
      return product;
    });

    await step.run("reindex-algolia", async () => {
      // TODO(phase-2): mergeProductRecord(shopify, specs, editorial) -> Algolia
      return { indexed: true };
    });

    await step.run("revalidate-tags", async () => {
      // TODO(phase-2): POST to /api/revalidate with product:{handle} + collection tags
      return { revalidated: true };
    });

    return { status: "reindexed" };
  },
);
