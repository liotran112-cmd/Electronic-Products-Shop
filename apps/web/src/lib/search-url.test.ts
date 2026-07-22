// @vitest-environment node
import { describe, expect, it } from "vitest";

import {
  clearFiltersHref,
  hasActiveRefinements,
  isFilterActive,
  pageHref,
  parseSearchParams,
  setSortHref,
  toggleFilterHref,
} from "./search-url";

describe("parseSearchParams", () => {
  it("parses query, brand, sort and page", () => {
    const params = parseSearchParams({ q: "esp32", brand: "Espressif", sort: "price_asc", page: "3" });
    expect(params).toMatchObject({ query: "esp32", brand: "Espressif", sort: "price_asc", page: 3 });
  });

  it("defaults page to 1 and drops invalid sort", () => {
    const params = parseSearchParams({ sort: "bogus", page: "0" });
    expect(params.page).toBe(1);
    expect(params.sort).toBeUndefined();
  });

  it("collects repeated refine tokens into filters", () => {
    const params = parseSearchParams({ refine: ["vendor:Espressif", "vendor:Adafruit", "voltage:5V"] });
    expect(params.filters).toEqual({ vendor: ["Espressif", "Adafruit"], voltage: ["5V"] });
  });

  it("parses a single refine token (string, not array)", () => {
    const params = parseSearchParams({ refine: "vendor:Espressif" });
    expect(params.filters).toEqual({ vendor: ["Espressif"] });
  });

  it("parses numeric ranges and ignores malformed ones", () => {
    const params = parseSearchParams({ range: ["price:0:50", "weight:nope"] });
    expect(params.range).toEqual({ price: [0, 50] });
  });
});

describe("toggleFilterHref (filters work, zero-JS)", () => {
  it("adds a facet value and resets the page", () => {
    const url = toggleFilterHref("/search", { q: "esp32", page: "4" }, "vendor", "Espressif");
    expect(url).toContain("refine=vendor%3AEspressif");
    expect(url).toContain("q=esp32");
    expect(url).not.toContain("page=");
  });

  it("removes a facet value when already active", () => {
    const url = toggleFilterHref("/search", { refine: "vendor:Espressif" }, "vendor", "Espressif");
    expect(url).toBe("/search");
  });

  it("preserves other active refinements when toggling one", () => {
    const url = toggleFilterHref(
      "/search",
      { refine: ["vendor:Espressif", "voltage:5V"] },
      "vendor",
      "Espressif",
    );
    expect(url).toContain("refine=voltage%3A5V");
    expect(url).not.toContain("vendor");
  });
});

describe("isFilterActive", () => {
  it("detects an active refinement", () => {
    expect(isFilterActive({ refine: "vendor:Espressif" }, "vendor", "Espressif")).toBe(true);
    expect(isFilterActive({ refine: "vendor:Espressif" }, "vendor", "Adafruit")).toBe(false);
  });
});

describe("sort + pagination hrefs", () => {
  it("sets sort and resets page", () => {
    const url = setSortHref("/c/dev-boards", { page: "2", sort: "newest" }, "price_desc");
    expect(url).toContain("sort=price_desc");
    expect(url).not.toContain("page=");
  });

  it("omits page param for page 1 (canonical URL)", () => {
    expect(pageHref("/search", { q: "esp32" }, 1)).toBe("/search?q=esp32");
    expect(pageHref("/search", { q: "esp32" }, 3)).toContain("page=3");
  });
});

describe("clearFiltersHref / hasActiveRefinements", () => {
  it("keeps query + sort, drops refinements", () => {
    const url = clearFiltersHref("/search", { q: "esp32", sort: "newest", refine: "vendor:Espressif" });
    expect(url).toContain("q=esp32");
    expect(url).toContain("sort=newest");
    expect(url).not.toContain("refine");
  });

  it("reports whether any refinement is active", () => {
    expect(hasActiveRefinements({ refine: "vendor:Espressif" })).toBe(true);
    expect(hasActiveRefinements({ range: "price:0:50" })).toBe(true);
    expect(hasActiveRefinements({ brand: "Espressif" })).toBe(true);
    expect(hasActiveRefinements({ q: "esp32" })).toBe(false);
  });
});
