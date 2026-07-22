import posthog from "posthog-js";

import { clientEnv } from "@repo/env";

/**
 * Browser analytics init. Call once from a Client Component provider. Loaded on
 * idle so it never blocks interaction (FRONTEND §9). Safe no-op during SSR.
 */
let started = false;

export function initAnalytics(): typeof posthog | undefined {
  if (typeof window === "undefined" || started) return started ? posthog : undefined;
  const env = clientEnv();
  posthog.init(env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: env.NEXT_PUBLIC_POSTHOG_HOST,
    capture_pageview: false,
    person_profiles: "identified_only",
  });
  started = true;
  return posthog;
}

export { posthog };
