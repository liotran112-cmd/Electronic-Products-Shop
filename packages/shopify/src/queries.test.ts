import { createHmac } from "node:crypto";

import { describe, expect, it, vi } from "vitest";

import { isTrustedShopDomain, verifyShopifyWebhook } from "./queries";

const SECRET = "shpss_test_secret";
function sign(body: string): string {
  return createHmac("sha256", SECRET).update(body, "utf8").digest("base64");
}

describe("verifyShopifyWebhook", () => {
  const body = JSON.stringify({ id: 123 });

  it("accepts a valid signature", () => {
    expect(verifyShopifyWebhook(body, sign(body), SECRET)).toBe(true);
  });

  it("rejects a tampered body (invalid signature)", () => {
    expect(verifyShopifyWebhook(body + " ", sign(body), SECRET)).toBe(false);
  });

  it("rejects a signature from the wrong secret", () => {
    const wrong = createHmac("sha256", "other").update(body).digest("base64");
    expect(verifyShopifyWebhook(body, wrong, SECRET)).toBe(false);
  });

  it("rejects empty secret or header defensively", () => {
    expect(verifyShopifyWebhook(body, sign(body), "")).toBe(false);
    expect(verifyShopifyWebhook(body, "", SECRET)).toBe(false);
  });
});

describe("isTrustedShopDomain", () => {
  it("matches case-insensitively", () => {
    expect(isTrustedShopDomain("My-Store.myshopify.com", "my-store.myshopify.com")).toBe(true);
  });
  it("rejects a spoofed / missing domain", () => {
    expect(isTrustedShopDomain("evil.myshopify.com", "my-store.myshopify.com")).toBe(false);
    expect(isTrustedShopDomain(null, "my-store.myshopify.com")).toBe(false);
  });
});

describe("fetchProductForSync", () => {
  it("returns null for a deleted/missing product", async () => {
    vi.resetModules();
    vi.doMock("./admin", () => ({
      admin: { request: vi.fn().mockResolvedValue({ product: null }) },
    }));
    const { fetchProductForSync } = await import("./queries");
    await expect(fetchProductForSync("gid://shopify/Product/999")).resolves.toBeNull();
    vi.doUnmock("./admin");
  });

  it("normalizes an Admin product into sync facts", async () => {
    vi.resetModules();
    vi.doMock("./admin", () => ({
      admin: {
        request: vi.fn().mockResolvedValue({
          product: {
            id: "gid://shopify/Product/1",
            handle: "esp32",
            title: "ESP32",
            vendor: "Espressif",
            productType: "Board",
            status: "ACTIVE",
            totalInventory: 1200,
            featuredImage: { url: "https://img/x.jpg" },
            priceRangeV2: {
              minVariantPrice: { amount: "12.90", currencyCode: "USD" },
              maxVariantPrice: { amount: "14.50" },
            },
            variants: {
              nodes: [
                {
                  id: "gid://shopify/ProductVariant/10",
                  sku: "SKU-1",
                  title: "Default",
                  price: "12.90",
                  inventoryQuantity: 1200,
                  selectedOptions: [{ name: "Header", value: "Yes" }],
                },
              ],
            },
          },
        }),
      },
    }));
    const { fetchProductForSync } = await import("./queries");
    const result = await fetchProductForSync("gid://shopify/Product/1");
    expect(result?.product.status).toBe("active");
    expect(result?.product.available).toBe(true);
    expect(result?.product.minPrice).toBe(12.9);
    expect(result?.variants[0]?.optionValues).toEqual({ Header: "Yes" });
    vi.doUnmock("./admin");
  });
});
