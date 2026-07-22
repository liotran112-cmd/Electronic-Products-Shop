import { algoliasearch, type Algoliasearch } from "algoliasearch";
import { liteClient, type LiteClient } from "algoliasearch/lite";

import { clientEnv, serverEnv } from "@repo/env";

/**
 * PUBLIC search client (lite build) — safe in the browser and RSC. Uses the
 * search-only key; for entitlement-gated results the app mints a short-TTL
 * secured key server-side and passes it here (SEARCH §7).
 */
export function searchClient(searchKey?: string): LiteClient {
  const env = clientEnv();
  return liteClient(env.NEXT_PUBLIC_ALGOLIA_APP_ID, searchKey ?? env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY);
}

/**
 * SERVER-ONLY admin client — uses the Admin API key for indexing, settings,
 * synonyms and Rules. Only call from Inngest functions / Route Handlers
 * (SEARCH §8). Never import into a client component.
 */
export function adminClient(): Algoliasearch {
  const env = serverEnv();
  return algoliasearch(env.NEXT_PUBLIC_ALGOLIA_APP_ID, env.ALGOLIA_ADMIN_KEY);
}
