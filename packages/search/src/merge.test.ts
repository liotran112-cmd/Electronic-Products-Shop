import { describe, expect, it } from "vitest";

import {
  mergeProductRecord,
  toHierarchicalFacet,
  type EditorialFacts,
  type ShopifyFacts,
  type SpecFacts,
} from "./merge";

const shopify: ShopifyFacts = {
  shopifyProductId: "gid://shopify/Product/1",
  handle: "esp32-devkit-v1",
  title: "ESP32 DevKit V1",
  vendor: "Espressif",
  productType: "Dev Board",
  status: "active",
  minPrice: 12.9,
  maxPrice: 14.5,
  currency: "USD",
  available: true,
  imageUrl: "https://res.cloudinary.com/x/esp32.jpg",
};

const editorial: EditorialFacts = { boostedKeywords: ["iot"], hasGuide: true };

function specs(partial: Partial<SpecFacts> = {}): SpecFacts {
  return {
    categoryTrail: ["Development Boards", "MCU Boards"],
    brandName: "Espressif",
    mpn: "ESP32-DEVKITC-32D",
    sku: "ESP32-DEVKIT-V1",
    ratingAvg: 4.7,
    ratingCount: 128,
    popularity: 8421,
    specs: {
      voltage_supply: { display: "5 V", num: 5, base: 5, unit: "V" },
      connectivity: { display: ["Wi-Fi", "Bluetooth"], values: ["WiFi", "Bluetooth"] },
      cpu: { display: "ESP32", text: "ESP32-D0WD" },
      op_temp: { display: "-40 to 85 °C", base: -40, base_high: 85, unit: "°C" },
      rohs: { display: "Yes", bool: true },
    },
    ...partial,
  };
}

describe("toHierarchicalFacet", () => {
  it("builds Algolia lvl0/lvl1 breadcrumb facets", () => {
    expect(toHierarchicalFacet(["Development Boards", "MCU Boards"])).toEqual({
      lvl0: "Development Boards",
      lvl1: "Development Boards > MCU Boards",
    });
  });

  it("handles an empty trail", () => {
    expect(toHierarchicalFacet([])).toEqual({});
  });
});

describe("mergeProductRecord", () => {
  it("uses the Shopify GID as objectID and derives the url", () => {
    const r = mergeProductRecord(shopify, specs(), editorial);
    expect(r.objectID).toBe("gid://shopify/Product/1");
    expect(r.url).toBe("/products/esp32-devkit-v1");
  });

  it("flattens numeric specs to BASE-unit facets (unit-independent filtering)", () => {
    const r = mergeProductRecord(shopify, specs(), editorial);
    expect(r.spec_voltage_supply).toBe(5); // base unit, not "5 V"
    expect(r.spec_op_temp).toBe(-40);
    expect(r.spec_op_temp_high).toBe(85);
  });

  it("keeps multi_enum specs as arrays for OR faceting", () => {
    const r = mergeProductRecord(shopify, specs(), editorial);
    expect(r.spec_connectivity).toEqual(["WiFi", "Bluetooth"]);
  });

  it("emits enum/text and boolean facets", () => {
    const r = mergeProductRecord(shopify, specs(), editorial);
    expect(r.spec_cpu).toBe("ESP32-D0WD");
    expect(r.spec_rohs).toBe(true);
  });

  it("builds a searchable specsText blob from all displays", () => {
    const r = mergeProductRecord(shopify, specs(), editorial);
    expect(r.specsText).toContain("5 V");
    expect(r.specsText).toContain("Wi-Fi");
    expect(r.specsText).toContain("ESP32");
  });

  it("sets published + inStockRank from Shopify status/availability", () => {
    expect(mergeProductRecord(shopify, specs(), editorial).published).toBe(true);
    expect(mergeProductRecord(shopify, specs(), editorial).inStockRank).toBe(1);
    const draft = mergeProductRecord({ ...shopify, status: "draft", available: false }, specs(), editorial);
    expect(draft.published).toBe(false);
    expect(draft.inStockRank).toBe(0);
  });

  it("handles a partial update with no specs (empty projection)", () => {
    const r = mergeProductRecord(shopify, specs({ specs: {} }), editorial);
    expect(r.specsText).toBe("");
    expect(r.spec_voltage_supply).toBeUndefined();
    expect(r.title).toBe("ESP32 DevKit V1"); // core fields still present
  });

  it("prefers the Supabase brand name over the Shopify vendor", () => {
    const r = mergeProductRecord({ ...shopify, vendor: "generic" }, specs({ brandName: "Espressif" }), editorial);
    expect(r.vendor).toBe("Espressif");
  });
});
