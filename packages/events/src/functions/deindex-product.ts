import { createLogger, newCorrelationId } from "@repo/core";
import { createServiceClient, recordSyncEvent } from "@repo/db";
import { adminClient, deleteProducts } from "@repo/search";

import { inngest } from "../client";

interface FailureEvent {
  data: { event?: { data?: { correlationId?: string; shopifyProductId?: string } } };
}

/**
 * Handle a deleted Shopify product: remove it from Algolia and archive the
 * mirror row (kept for redirects / order history). objectID = Shopify GID.
 * Concurrency-serialized per product; failures land in the dead-letter table.
 */
export const deindexProduct = inngest.createFunction(
  {
    id: "deindex-product",
    retries: 3,
    concurrency: { key: "event.data.shopifyProductId", limit: 1 },
    onFailure: async ({ event, error }) => {
      const original = (event as unknown as FailureEvent).data.event;
      await recordSyncEvent(createServiceClient(), {
        correlationId: original?.data?.correlationId ?? null,
        entityRef: original?.data?.shopifyProductId ?? null,
        event: "deindex",
        status: "failed",
        attempts: 4,
        error: error.message,
      });
    },
  },
  { event: "shopify/product.deleted" },
  async ({ event, step, runId }) => {
    const correlationId = event.data.correlationId ?? newCorrelationId("deindex");
    const log = createLogger({ correlationId, runId, fn: "deindex-product" });
    const startedAt = Date.now();

    await step.run("delete-algolia", async () => {
      await deleteProducts(adminClient(), [event.data.shopifyProductId]);
      return { deleted: true };
    });

    await step.run("archive-mirror", async () => {
      const db = createServiceClient();
      const { error } = await db
        .from("products")
        .update({ status: "archived", updated_at: new Date().toISOString() })
        .eq("shopify_product_id", event.data.shopifyProductId);
      if (error) throw new Error(`archive-mirror: ${error.message}`);
      return { archived: true };
    });

    await step.run("record-success", () =>
      recordSyncEvent(createServiceClient(), {
        correlationId,
        entityRef: event.data.shopifyProductId,
        event: "deindex",
        status: "deindexed",
        durationMs: Date.now() - startedAt,
      }),
    );

    log.info("deindexed", { entityRef: event.data.shopifyProductId });
    return { status: "deindexed" };
  },
);
