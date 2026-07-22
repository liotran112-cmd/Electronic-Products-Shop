// @vitest-environment node
import { createHmac } from "node:crypto";

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

const SECRET = "shpss_test";
const DOMAIN = "my-store.myshopify.com";

const h = vi.hoisted(() => ({ set: vi.fn(), del: vi.fn(), send: vi.fn() }));

vi.mock("@repo/kv", () => ({ redis: () => ({ set: h.set, del: h.del }) }));
vi.mock("@repo/events", () => ({ inngest: { send: h.send } }));
vi.mock("@repo/env", () => ({
  serverEnv: () => ({ SHOPIFY_WEBHOOK_SECRET: SECRET, SHOPIFY_STORE_DOMAIN: DOMAIN }),
  requireEnv: (v: unknown, n: string) => {
    if (v === undefined || v === null || v === "") throw new Error(`Missing ${n}`);
    return v;
  },
}));

// Imported after mocks are registered.
const { POST } = await import("./route");

function sign(body: string): string {
  return createHmac("sha256", SECRET).update(body, "utf8").digest("base64");
}

function makeReq(body: string, headers: Record<string, string>): NextRequest {
  return new Request("http://localhost/api/webhooks/shopify", {
    method: "POST",
    body,
    headers,
  }) as unknown as NextRequest;
}

const BODY = JSON.stringify({ id: 123, admin_graphql_api_id: "gid://shopify/Product/123" });

function headers(topic = "products/update", overrides: Record<string, string> = {}) {
  return {
    "x-shopify-hmac-sha256": sign(BODY),
    "x-shopify-topic": topic,
    "x-shopify-webhook-id": "wh-1",
    "x-shopify-shop-domain": DOMAIN,
    ...overrides,
  };
}

beforeEach(() => {
  h.set.mockReset().mockResolvedValue("OK");
  h.del.mockReset().mockResolvedValue(1);
  h.send.mockReset().mockResolvedValue(undefined);
});

describe("POST /api/webhooks/shopify", () => {
  it("queues a valid product update", async () => {
    const res = await POST(makeReq(BODY, headers()));
    expect(res.status).toBe(200);
    expect(h.send).toHaveBeenCalledWith({
      name: "shopify/product.updated",
      data: expect.objectContaining({ shopifyProductId: "gid://shopify/Product/123" }),
    });
  });

  it("routes delete topics to the deindex event", async () => {
    await POST(makeReq(BODY, headers("products/delete")));
    expect(h.send).toHaveBeenCalledWith({
      name: "shopify/product.deleted",
      data: expect.objectContaining({ shopifyProductId: "gid://shopify/Product/123" }),
    });
  });

  it("rejects an invalid signature with 401 and never enqueues", async () => {
    const res = await POST(makeReq(BODY, headers("products/update", { "x-shopify-hmac-sha256": "bad" })));
    expect(res.status).toBe(401);
    expect(h.send).not.toHaveBeenCalled();
  });

  it("rejects an untrusted shop domain with 401", async () => {
    const res = await POST(makeReq(BODY, headers("products/update", { "x-shopify-shop-domain": "evil.myshopify.com" })));
    expect(res.status).toBe(401);
    expect(h.send).not.toHaveBeenCalled();
  });

  it("ignores a duplicate webhook (idempotency reserve returns null)", async () => {
    h.set.mockResolvedValue(null);
    const res = await POST(makeReq(BODY, headers()));
    const json = (await res.json()) as { status: string };
    expect(json.status).toBe("duplicate");
    expect(h.send).not.toHaveBeenCalled();
  });

  it("releases the reservation and 500s when enqueue fails (no lost update)", async () => {
    h.send.mockRejectedValue(new Error("inngest down"));
    const res = await POST(makeReq(BODY, headers()));
    expect(res.status).toBe(500);
    expect(h.del).toHaveBeenCalledWith("shopify:wh:wh-1"); // reservation rolled back
  });
});
