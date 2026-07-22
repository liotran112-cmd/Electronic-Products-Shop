import { describe, expect, it, vi } from "vitest";

import { HttpError, isRetryableError, isRetryableStatus, retry } from "./http";

describe("isRetryableStatus", () => {
  it("retries 429/408/5xx, not 4xx", () => {
    expect(isRetryableStatus(429)).toBe(true);
    expect(isRetryableStatus(503)).toBe(true);
    expect(isRetryableStatus(408)).toBe(true);
    expect(isRetryableStatus(400)).toBe(false);
    expect(isRetryableStatus(404)).toBe(false);
    expect(isRetryableStatus(200)).toBe(false);
  });
});

describe("retry", () => {
  it("returns on first success without retrying", async () => {
    const fn = vi.fn().mockResolvedValue("ok");
    await expect(retry(fn, { baseMs: 1 })).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries transient failures up to the limit then throws", async () => {
    const fn = vi.fn().mockRejectedValue(new HttpError(503, "u", null));
    await expect(retry(fn, { retries: 2, baseMs: 1 })).rejects.toBeInstanceOf(HttpError);
    expect(fn).toHaveBeenCalledTimes(3); // initial + 2 retries
  });

  it("does not retry non-retryable errors", async () => {
    const fn = vi.fn().mockRejectedValue(new HttpError(400, "u", null));
    await expect(retry(fn, { retries: 3, baseMs: 1, isRetryable: isRetryableError })).rejects.toThrow();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("eventually succeeds after transient failures", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new HttpError(500, "u", null))
      .mockResolvedValue("recovered");
    await expect(retry(fn, { retries: 3, baseMs: 1 })).resolves.toBe("recovered");
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
