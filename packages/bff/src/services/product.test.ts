import { beforeEach, describe, expect, it, vi } from "vitest";

import { DraftError, GoneError, NotFoundError } from "../errors";
import type { CatalogProduct } from "../repositories/catalog.repo";

const h = vi.hoisted(() => ({
  getCatalogProduct: vi.fn(),
  getProductEditorial: vi.fn(),
  relatedHits: vi.fn(),
  getLivePricing: vi.fn(),
}));

// Cache becomes a passthrough so we test the composition, not Next internals.
vi.mock("@repo/cache", () => ({
  withCache: (fn: unknown) => fn,
  memo: (fn: unknown) => fn,
  TAGS: {
    product: () => "product",
    content: () => "content",
    collection: () => "collection",
    homepage: () => "homepage",
    navigation: () => "navigation",
    category: () => "category",
    brand: () => "brand",
    recommendations: () => "recs",
  },
  TTL: { minute: 60, fiveMinutes: 300, fifteenMinutes: 900, hour: 3600, day: 86_400 },
}));
vi.mock("../repositories/catalog.repo", () => ({ getCatalogProduct: h.getCatalogProduct }));
vi.mock("../repositories/content.repo", () => ({ getProductEditorial: h.getProductEditorial }));
vi.mock("../repositories/search.repo", () => ({ relatedHits: h.relatedHits }));
vi.mock("../repositories/commerce.repo", () => ({ getLivePricing: h.getLivePricing }));

const { getProductPage, getLivePricing } = await import("./product");

function core(overrides: Partial<CatalogProduct> = {}): CatalogProduct {
  return {
    id: "p1",
    handle: "esp32",
    title: "ESP32",
    subtitle: null,
    status: "active",
    kind: "consumer",
    mpn: null,
    heroImageUrl: null,
    specs: {},
    ratingAvg: null,
    ratingCount: 0,
    isQuotable: false,
    brand: null,
    primaryCategory: null,
    categoryTrail: ["Dev Boards", "MCU Boards"],
    variants: [
      { id: "v", shopifyVariantId: null, sku: "s", title: null, optionValues: {}, priceSnapshot: 10, currency: "USD", position: 0 },
    ],
    documents: [],
    compatibility: [],
    ...overrides,
  };
}

beforeEach(() => {
  h.getCatalogProduct.mockReset();
  h.getProductEditorial.mockReset().mockResolvedValue(null);
  h.relatedHits.mockReset().mockResolvedValue([]);
  h.getLivePricing.mockReset();
});

describe("getProductPage", () => {
  it("returns a ProductDetail for an active product", async () => {
    h.getCatalogProduct.mockResolvedValue(core());
    const d = await getProductPage("esp32");
    expect(d.title).toBe("ESP32");
    expect(d.price.formatted).toBe("$10.00");
  });

  it("throws NotFoundError when the product is missing", async () => {
    h.getCatalogProduct.mockResolvedValue(null);
    await expect(getProductPage("x")).rejects.toBeInstanceOf(NotFoundError);
  });

  it("throws DraftError for a draft (public 404)", async () => {
    h.getCatalogProduct.mockResolvedValue(core({ status: "draft" }));
    await expect(getProductPage("x")).rejects.toBeInstanceOf(DraftError);
  });

  it("throws GoneError for an archived product", async () => {
    h.getCatalogProduct.mockResolvedValue(core({ status: "archived" }));
    await expect(getProductPage("x")).rejects.toBeInstanceOf(GoneError);
  });

  it("DEGRADES when editorial fails — page still renders", async () => {
    h.getCatalogProduct.mockResolvedValue(core());
    h.getProductEditorial.mockRejectedValue(new Error("sanity down"));
    const d = await getProductPage("esp32");
    expect(d.description).toBeUndefined();
    expect(d.title).toBe("ESP32");
  });

  it("DEGRADES when related products fail", async () => {
    h.getCatalogProduct.mockResolvedValue(core());
    h.relatedHits.mockRejectedValue(new Error("algolia down"));
    const d = await getProductPage("esp32");
    expect(d.accessories).toEqual([]);
  });
});

describe("getLivePricing", () => {
  it("maps authoritative live variants", async () => {
    h.getLivePricing.mockResolvedValue([
      { id: "v", sku: "s", availableForSale: true, quantityAvailable: 100, price: { amount: 12.9, currency: "USD" }, compareAtPrice: null },
    ]);
    const p = await getLivePricing("esp32");
    expect(p.variants[0]?.availability).toBe("in_stock");
    expect(p.variants[0]?.price.formatted).toBe("$12.90");
  });

  it("throws NotFoundError when the product has no pricing", async () => {
    h.getLivePricing.mockResolvedValue(null);
    await expect(getLivePricing("x")).rejects.toBeInstanceOf(NotFoundError);
  });
});
