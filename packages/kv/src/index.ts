import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import { serverEnv } from "@repo/env";

/**
 * Upstash Redis (SERVER-ONLY). Backs webhook idempotency keys, rate limiting and
 * hot caching (ARCHITECTURE §2/§9). REST-based, so it works on edge and
 * serverless without holding connections.
 */
let cached: Redis | undefined;

export function redis(): Redis {
  if (!cached) {
    const env = serverEnv();
    if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
      throw new Error("Upstash not configured — set UPSTASH_REDIS_REST_URL / _TOKEN");
    }
    cached = new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return cached;
}

/** Sliding-window limiter (default 10 requests / 10s) for Server Actions & webhooks. */
export function rateLimiter(prefix = "ratelimit"): Ratelimit {
  return new Ratelimit({
    redis: redis(),
    limiter: Ratelimit.slidingWindow(10, "10 s"),
    prefix,
    analytics: true,
  });
}
