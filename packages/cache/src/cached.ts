import { unstable_cache } from "next/cache";
import { cache } from "react";

export interface CacheOptions {
  /** Static key prefix; the function arguments are appended automatically. */
  keyParts: string[];
  tags: string[];
  /** Seconds; use a TTL constant. */
  revalidate: number;
}

/**
 * Cross-request, tag-invalidated cache (read-through). Wraps `unstable_cache`
 * so services declare `{ keyParts, tags, revalidate }` and never touch the
 * primitive. Arguments are part of the cache key.
 */
export function withCache<A extends unknown[], R>(
  fn: (...args: A) => Promise<R>,
  options: CacheOptions,
): (...args: A) => Promise<R> {
  return unstable_cache(fn, options.keyParts, {
    tags: options.tags,
    revalidate: options.revalidate,
  });
}

/**
 * Request-level memoization (React `cache`). Dedupes calls within a single
 * render — e.g. `generateMetadata` and the page both calling `getProductPage`.
 */
export const memo = cache;
