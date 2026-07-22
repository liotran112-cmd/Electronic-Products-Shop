import { describe, expect, it, vi } from "vitest";

import type { Algoliasearch } from "algoliasearch";

import { deleteProducts, indexProducts } from "./indexer";
import type { ProductSearchRecord } from "./merge";

function mockAdmin() {
  return {
    saveObjects: vi.fn().mockResolvedValue([]),
    deleteObjects: vi.fn().mockResolvedValue([]),
  } as unknown as Algoliasearch & {
    saveObjects: ReturnType<typeof vi.fn>;
    deleteObjects: ReturnType<typeof vi.fn>;
  };
}

const record = { objectID: "gid://shopify/Product/1", handle: "x" } as unknown as ProductSearchRecord;

describe("indexProducts", () => {
  it("writes records to the primary index", async () => {
    const admin = mockAdmin();
    await indexProducts(admin, [record]);
    expect(admin.saveObjects).toHaveBeenCalledWith({
      indexName: "products",
      objects: [record],
    });
  });

  it("is a no-op for an empty batch (no API call)", async () => {
    const admin = mockAdmin();
    await indexProducts(admin, []);
    expect(admin.saveObjects).not.toHaveBeenCalled();
  });
});

describe("deleteProducts", () => {
  it("deletes by objectID", async () => {
    const admin = mockAdmin();
    await deleteProducts(admin, ["gid://shopify/Product/1"]);
    expect(admin.deleteObjects).toHaveBeenCalledWith({
      indexName: "products",
      objectIDs: ["gid://shopify/Product/1"],
    });
  });

  it("is a no-op for an empty batch", async () => {
    const admin = mockAdmin();
    await deleteProducts(admin, []);
    expect(admin.deleteObjects).not.toHaveBeenCalled();
  });
});
