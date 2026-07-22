import { describe, expect, it } from "vitest";

import type { CatalogProduct } from "../repositories/catalog.repo";
import type { ProductEditorialDoc } from "../repositories/content.repo";
import { toProductDetail } from "./product.mapper";

function catalog(overrides: Partial<CatalogProduct> = {}): CatalogProduct {
  return {
    id: "p1",
    handle: "esp32-devkit-v1",
    title: "ESP32 DevKit V1",
    subtitle: "Wi-Fi + BT dev board",
    status: "active",
    kind: "consumer",
    mpn: "ESP32-DEVKITC-32D",
    heroImageUrl: "https://res.cloudinary.com/x/esp32.jpg",
    specs: { voltage_supply: { display: "5 V" }, connectivity: { display: ["Wi-Fi", "Bluetooth"] } },
    ratingAvg: 4.7,
    ratingCount: 128,
    isQuotable: false,
    brand: { name: "Espressif", slug: "espressif", logoUrl: null },
    primaryCategory: { name: "MCU Boards", slug: "mcu-boards" },
    categoryTrail: ["Development Boards", "MCU Boards"],
    variants: [
      { id: "v1", shopifyVariantId: "gid://v/1", sku: "SKU1", title: "Default", optionValues: {}, priceSnapshot: 12.9, currency: "USD", position: 0 },
    ],
    documents: [
      { id: "d1", docType: "datasheet", title: "Datasheet", url: "u", language: "en", version: "1", sizeBytes: 2_400_000 },
      { id: "d2", docType: "guide", title: "Guide", url: "g", language: null, version: null, sizeBytes: null },
    ],
    compatibility: [{ label: "Arduino IDE", targetProductId: null }],
    ...overrides,
  };
}

describe("toProductDetail", () => {
  it("composes core fields, price snapshot and breadcrumbs", () => {
    const d = toProductDetail(catalog(), null, []);
    expect(d.title).toBe("ESP32 DevKit V1");
    expect(d.brand.name).toBe("Espressif");
    expect(d.price.formatted).toBe("$12.90");
    expect(d.breadcrumbs.map((b) => b.name)).toEqual(["Home", "MCU Boards", "ESP32 DevKit V1"]);
    expect(d.specificationGroups[0]?.specifications).toHaveLength(2);
  });

  it("maps documents and normalizes 'guide' → manual, formats size", () => {
    const d = toProductDetail(catalog(), null, []);
    expect(d.documents).toHaveLength(2);
    expect(d.documents[0]).toMatchObject({ type: "datasheet", sizeLabel: "2.4 MB" });
    expect(d.documents[1]?.type).toBe("manual");
  });

  it("substitutes a placeholder image when no gallery exists (zero CLS)", () => {
    const d = toProductDetail(catalog({ heroImageUrl: null }), null, []);
    expect(d.gallery).toHaveLength(1);
    expect(d.gallery[0]?.width).toBe(800);
    expect(d.gallery[0]?.url).toContain("placeholder");
  });

  it("degrades cleanly with no editorial (empty enhancement sections)", () => {
    const d = toProductDetail(catalog(), null, []);
    expect(d.description).toBeUndefined();
    expect(d.keyBenefits).toEqual([]);
    expect(d.tutorials).toEqual([]);
  });

  it("merges Sanity editorial (description, benefits, tutorials, manuals)", () => {
    const editorial: ProductEditorialDoc = {
      description: [{ type: "block", text: "Great board" }],
      keyBenefits: ["Low power"],
      tutorials: [{ title: "Getting started", slug: "gs", excerpt: "…" }],
      manuals: [{ title: "User manual", url: "m", version: "2" }],
    };
    const d = toProductDetail(catalog(), editorial, []);
    expect(d.keyBenefits).toEqual(["Low power"]);
    expect(d.tutorials[0]?.href).toBe("/learn/gs");
    expect(d.documents.some((x) => x.type === "manual" && x.title === "User manual")).toBe(true);
  });

  it("flags custom/quotable products", () => {
    expect(toProductDetail(catalog({ kind: "custom" }), null, []).isCustom).toBe(true);
    expect(toProductDetail(catalog({ isQuotable: true }), null, []).isCustom).toBe(true);
    expect(toProductDetail(catalog(), null, []).isCustom).toBe(false);
  });
});
