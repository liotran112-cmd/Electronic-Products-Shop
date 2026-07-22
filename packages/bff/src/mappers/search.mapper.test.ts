import { describe, expect, it } from "vitest";

import type { SearchResponseShape } from "../repositories/search.repo";
import { toSearchResult } from "./search.mapper";

const response: SearchResponseShape = {
  hits: [
    {
      objectID: "gid://p/1",
      handle: "esp32",
      url: "/products/esp32",
      title: "ESP32",
      vendor: "Espressif",
      image: "https://img/x.jpg",
      price: 12.9,
      currency: "USD",
      available: true,
      rating: 4.7,
      ratingCount: 128,
    },
  ],
  facets: { vendor: { Espressif: 10, Bosch: 3 }, "categories.lvl0": { "Dev Boards": 5 } },
  nbHits: 42,
  page: 1,
  nbPages: 3,
  hitsPerPage: 24,
};

describe("toSearchResult", () => {
  it("maps hits to summaries", () => {
    const r = toSearchResult(response, {});
    expect(r.items).toHaveLength(1);
    expect(r.items[0]).toMatchObject({ handle: "esp32", brand: "Espressif" });
    expect(r.items[0]?.price.formatted).toBe("$12.90");
  });

  it("converts 0-based Algolia paging to 1-based with flags", () => {
    const r = toSearchResult(response, {});
    expect(r.pagination).toMatchObject({ page: 2, total: 42, totalPages: 3, hasNext: true, hasPrev: true });
  });

  it("builds facets sorted by count and marks selected values", () => {
    const r = toSearchResult(response, { filters: { vendor: ["Espressif"] } });
    const vendor = r.facets.find((f) => f.attribute === "vendor");
    expect(vendor?.label).toBe("Brand");
    expect(vendor?.values[0]).toMatchObject({ value: "Espressif", count: 10, selected: true });
    expect(vendor?.values[1]?.selected).toBe(false);
  });

  it("marks category facets as hierarchical and lists applied filters", () => {
    const r = toSearchResult(response, { filters: { vendor: ["Espressif"] } });
    expect(r.facets.find((f) => f.attribute === "categories.lvl0")?.type).toBe("hierarchical");
    expect(r.appliedFilters).toEqual([{ attribute: "vendor", label: "Brand", value: "Espressif" }]);
  });
});
