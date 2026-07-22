import { createLogger, fetchWithTimeout, newCorrelationId } from "@repo/core";
import {
  createServiceClient,
  findProductByHandle,
  findShopifyIdByProductId,
  loadProductForIndex,
  recordSyncEvent,
  upsertProductMirror,
} from "@repo/db";
import { requireEnv, serverEnv } from "@repo/env";
import { sanity } from "@repo/sanity";
import {
  adminClient,
  deleteProducts,
  indexProducts,
  mergeProductRecord,
  type EditorialFacts,
  type ShopifyFacts,
  type SpecFacts,
  type SpecProjection,
} from "@repo/search";
import { fetchProductForSync } from "@repo/shopify";

import { inngest } from "../client";

interface FailureEvent {
  data: { event?: { data?: { correlationId?: string; shopifyProductId?: string } } };
}

/**
 * Re-merge and reindex a product's Algolia record whenever any source of truth
 * changes (ARCHITECTURE §4.1). Hardened (audit):
 *  - per-product concurrency=1 → no duplicate/racing indexing from rapid webhooks
 *  - re-fetch from Shopify → convergent regardless of webhook ordering
 *  - deleted/unfound product → de-index + archive instead of failing
 *  - non-fatal revalidate → a CDN blip never fails an indexed product
 *  - correlationId threaded through structured logs → end-to-end traceable
 *  - onFailure → dead-letter row in sync_events
 */
export const reindexProduct = inngest.createFunction(
  {
    id: "reindex-product",
    retries: 4,
    // Serialize per product (Shopify events). Events without shopifyProductId
    // (specs/sanity) run unbounded — safe because the pipeline is convergent.
    concurrency: { key: "event.data.shopifyProductId", limit: 1 },
    onFailure: async ({ event, error }) => {
      const original = (event as unknown as FailureEvent).data.event;
      await recordSyncEvent(createServiceClient(), {
        correlationId: original?.data?.correlationId ?? null,
        entityRef: original?.data?.shopifyProductId ?? null,
        event: "reindex",
        status: "failed",
        attempts: 5,
        error: error.message,
      });
    },
  },
  [
    { event: "shopify/product.updated" },
    { event: "supabase/specs.updated" },
    { event: "sanity/document.published" },
  ],
  async ({ event, step, runId }) => {
    const correlationId = event.data.correlationId ?? newCorrelationId("reindex");
    const log = createLogger({ correlationId, runId, fn: "reindex-product" });
    const startedAt = Date.now();

    // 1. Normalize whichever event fired to a canonical Shopify product GID.
    const target = await step.run("resolve", async () => {
      const db = createServiceClient();
      const data = event.data;
      if ("shopifyProductId" in data) return { shopifyProductId: data.shopifyProductId };
      if ("productId" in data) {
        const sid = await findShopifyIdByProductId(db, data.productId);
        return sid ? { shopifyProductId: sid } : null;
      }
      const doc = await sanity.fetch<{ productHandle?: string }>(
        `*[_id == $id][0]{ productHandle }`,
        { id: data.documentId },
      );
      if (!doc?.productHandle) return null;
      const row = await findProductByHandle(db, doc.productHandle);
      return row?.shopify_product_id ? { shopifyProductId: row.shopify_product_id } : null;
    });

    if (!target) {
      log.info("skipped: unresolved event");
      await step.run("record-skip", () =>
        recordSyncEvent(createServiceClient(), {
          correlationId,
          event: "reindex",
          status: "skipped",
        }),
      );
      return { status: "skipped", reason: "unresolved" };
    }

    // 2. Fetch authoritative commerce facts (incl. drafts). null ⇒ deleted.
    const shopify = await step.run("fetch-shopify", () =>
      fetchProductForSync(target.shopifyProductId),
    );

    if (!shopify) {
      // Product vanished between webhook and processing → treat as a delete.
      log.warn("product not found — de-indexing", { entityRef: target.shopifyProductId });
      await step.run("deindex-missing", async () => {
        await deleteProducts(adminClient(), [target.shopifyProductId]);
        const db = createServiceClient();
        await db
          .from("products")
          .update({ status: "archived", updated_at: new Date().toISOString() })
          .eq("shopify_product_id", target.shopifyProductId);
        await recordSyncEvent(db, {
          correlationId,
          entityRef: target.shopifyProductId,
          event: "reindex",
          status: "deindexed",
          durationMs: Date.now() - startedAt,
        });
        return { deindexed: true };
      });
      return { status: "deindexed", reason: "not-found" };
    }

    // 3. Upsert Shopify-owned mirror columns; get the Supabase id.
    const productId = await step.run("upsert-mirror", async () => {
      const db = createServiceClient();
      return upsertProductMirror(
        db,
        {
          shopifyProductId: shopify.product.shopifyProductId,
          handle: shopify.product.handle,
          title: shopify.product.title,
          status: shopify.product.status,
          heroImageUrl: shopify.product.imageUrl,
        },
        shopify.variants.map((v) => ({
          shopifyVariantId: v.shopifyVariantId,
          sku: v.sku,
          title: v.title,
          optionValues: v.optionValues,
          priceSnapshot: v.price,
          currency: v.currency,
          position: v.position,
        })),
      );
    });

    // 4. Load Supabase catalog facts (specs projection + brand + category trail).
    const facts = await step.run("load-facts", async () => {
      const db = createServiceClient();
      return loadProductForIndex(db, productId);
    });

    // 5. Load the editorial signal from Sanity (best-effort).
    const editorial = await step.run("load-editorial", async (): Promise<EditorialFacts> => {
      try {
        const doc = await sanity.fetch<{ keywords?: string[]; hasGuide?: boolean }>(
          `*[_type == "product" && productHandle == $h][0]{ "keywords": boostedKeywords, "hasGuide": count(tutorials) > 0 }`,
          { h: shopify.product.handle },
        );
        return { boostedKeywords: doc?.keywords ?? [], hasGuide: doc?.hasGuide ?? false };
      } catch {
        return { boostedKeywords: [], hasGuide: false };
      }
    });

    // 6. Merge (pure) and upsert the Algolia record.
    const indexed = await step.run("reindex-algolia", async () => {
      const shopifyFacts: ShopifyFacts = shopify.product;
      const specFacts: SpecFacts = {
        categoryTrail: facts.categoryTrail,
        brandName: facts.brandName,
        mpn: facts.mpn,
        sku: shopify.variants[0]?.sku ?? null,
        ratingAvg: facts.ratingAvg,
        ratingCount: facts.ratingCount,
        popularity: 0,
        specs: facts.specs as unknown as SpecProjection,
      };
      const record = mergeProductRecord(shopifyFacts, specFacts, editorial);
      await indexProducts(adminClient(), [record]);
      return { objectID: record.objectID, specCount: Object.keys(specFacts.specs).length };
    });

    // 7. Invalidate the product page + collections (best-effort; never fatal).
    await step.run("revalidate", async () => {
      const env = serverEnv();
      if (!env.REVALIDATE_SECRET) return { skipped: true };
      try {
        await fetchWithTimeout(
          `${env.NEXT_PUBLIC_SITE_URL}/api/revalidate`,
          {
            method: "POST",
            headers: {
              "content-type": "application/json",
              "x-revalidate-secret": requireEnv(env.REVALIDATE_SECRET, "REVALIDATE_SECRET"),
            },
            body: JSON.stringify({ tags: [`product:${shopify.product.handle}`, "collection:all"] }),
          },
          5_000,
        );
        return { revalidated: true };
      } catch (error) {
        log.warn("revalidate failed (non-fatal)", {
          error: error instanceof Error ? error.message : String(error),
        });
        return { revalidated: false };
      }
    });

    // 8. Record success (sync history + index statistics).
    const durationMs = Date.now() - startedAt;
    await step.run("record-success", () =>
      recordSyncEvent(createServiceClient(), {
        correlationId,
        entityRef: shopify.product.shopifyProductId,
        event: "reindex",
        status: "indexed",
        durationMs,
      }),
    );

    log.info("reindexed", {
      handle: shopify.product.handle,
      specCount: indexed.specCount,
      durationMs,
    });
    return { status: "reindexed", handle: shopify.product.handle };
  },
);
