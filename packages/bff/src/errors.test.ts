import { describe, expect, it } from "vitest";

import { DraftError, GoneError, isNotFoundLike, NotFoundError, UpstreamError } from "./errors";

describe("BFF errors", () => {
  it("carries typed context and a stable name", () => {
    const e = new NotFoundError("product", "esp32");
    expect(e.name).toBe("NotFoundError");
    expect(e.resource).toBe("product");
    expect(e.ref).toBe("esp32");
    expect(e).toBeInstanceOf(Error);
  });

  it("isNotFoundLike groups 404-ish errors, excludes upstream", () => {
    expect(isNotFoundLike(new NotFoundError("product", "x"))).toBe(true);
    expect(isNotFoundLike(new GoneError("x"))).toBe(true);
    expect(isNotFoundLike(new DraftError("x"))).toBe(true);
    expect(isNotFoundLike(new UpstreamError("shopify"))).toBe(false);
    expect(isNotFoundLike(new Error("generic"))).toBe(false);
  });
});
