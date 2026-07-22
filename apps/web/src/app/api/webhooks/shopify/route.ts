import { NextResponse, type NextRequest } from "next/server";

import { createLogger, newCorrelationId } from "@repo/core";
import { requireEnv, serverEnv } from "@repo/env";
import { inngest } from "@repo/events";
import { redis } from "@repo/kv";
import { isTrustedShopDomain, verifyShopifyWebhook } from "@repo/shopify";

/**
 * Shopify webhook ingestion (ARCHITECTURE §4.1). Hardened (audit):
 *  - HMAC verified on the RAW body BEFORE parsing
 *  - shop-domain checked against ours (anti-spoof)
 *  - idempotency RESERVE → enqueue → rollback-on-failure, so a failed enqueue
 *    never permanently swallows an update (the original data-loss bug)
 *  - correlationId threaded into the event for end-to-end tracing
 */
export async function POST(request: NextRequest) {
  const correlationId = newCorrelationId("wh");
  const log = createLogger({ correlationId, route: "webhooks/shopify" });

  const raw = await request.text();
  const hmac = request.headers.get("x-shopify-hmac-sha256") ?? "";
  const topic = request.headers.get("x-shopify-topic") ?? "";
  const webhookId = request.headers.get("x-shopify-webhook-id") ?? "";
  const shopDomain = request.headers.get("x-shopify-shop-domain");

  const env = serverEnv();
  const secret = requireEnv(env.SHOPIFY_WEBHOOK_SECRET, "SHOPIFY_WEBHOOK_SECRET");
  const expectedDomain = requireEnv(env.SHOPIFY_STORE_DOMAIN, "SHOPIFY_STORE_DOMAIN");

  if (!verifyShopifyWebhook(raw, hmac, secret)) {
    log.warn("invalid signature", { topic });
    return new NextResponse("Invalid signature", { status: 401 });
  }
  if (!isTrustedShopDomain(shopDomain, expectedDomain)) {
    log.warn("untrusted shop domain", { shopDomain });
    return new NextResponse("Untrusted shop", { status: 401 });
  }

  // Idempotency: reserve the webhook id first. Fail-open if Redis is down.
  let reserved = false;
  try {
    const first = await redis().set(`shopify:wh:${webhookId}`, correlationId, {
      nx: true,
      ex: 86_400,
    });
    if (first === null) {
      log.info("duplicate webhook ignored", { webhookId, topic });
      return NextResponse.json({ status: "duplicate" });
    }
    reserved = true;
  } catch (error) {
    log.warn("idempotency store unavailable — proceeding without dedupe", {
      error: error instanceof Error ? error.message : String(error),
    });
  }

  try {
    const body = JSON.parse(raw) as { id: number | string; admin_graphql_api_id?: string };
    const gid = body.admin_graphql_api_id ?? `gid://shopify/Product/${body.id}`;

    if (topic.startsWith("products/delete")) {
      await inngest.send({ name: "shopify/product.deleted", data: { shopifyProductId: gid, correlationId } });
    } else {
      await inngest.send({ name: "shopify/product.updated", data: { shopifyProductId: gid, correlationId } });
    }

    log.info("queued", { topic, gid });
    return NextResponse.json({ status: "queued", correlationId });
  } catch (error) {
    // Enqueue (or parse) failed AFTER reserving → release the reservation so
    // Shopify's automatic retry is NOT treated as a duplicate and re-processes.
    if (reserved) {
      try {
        await redis().del(`shopify:wh:${webhookId}`);
      } catch {
        // best-effort release
      }
    }
    log.error("enqueue failed — released reservation for retry", {
      error: error instanceof Error ? error.message : String(error),
    });
    return new NextResponse("Enqueue failed", { status: 500 });
  }
}
