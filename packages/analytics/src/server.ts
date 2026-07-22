import { PostHog } from "posthog-node";

import { clientEnv } from "@repo/env";

/**
 * SERVER-ONLY PostHog client for capturing events from Server Actions / Route
 * Handlers (e.g. quote_submitted). Remember to `await client.shutdown()` in
 * short-lived serverless invocations so events flush.
 */
let cached: PostHog | undefined;

export function analyticsServer(): PostHog {
  if (!cached) {
    const env = clientEnv();
    cached = new PostHog(env.NEXT_PUBLIC_POSTHOG_KEY, { host: env.NEXT_PUBLIC_POSTHOG_HOST });
  }
  return cached;
}
