import { fetchWithTimeout, HttpError, isRetryableError, retry } from "@repo/core";

/**
 * Sanity read client (GROQ). Editorial is a source of truth for tutorials,
 * guides, docs and marketing copy; this package will hold the schema, typed
 * GROQ queries and `sanity typegen` output in Phase 3.
 */
export interface SanityEnv {
  projectId: string;
  dataset: string;
  apiVersion: string;
}

export function readSanityEnv(): SanityEnv {
  return {
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "",
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
    apiVersion: process.env.SANITY_API_VERSION ?? "2025-01-01",
  };
}

export interface SanityClient {
  fetch<T>(groq: string, params?: Record<string, unknown>): Promise<T>;
}

/**
 * GROQ client over the public query API (CDN), with timeout + retry. Swap for
 * `@sanity/client` in Phase 3; kept dependency-light for now. Params are passed
 * as individual `$name` query args (Sanity's documented encoding).
 */
export const sanity: SanityClient = {
  async fetch<T>(groq: string, params: Record<string, unknown> = {}): Promise<T> {
    const env = readSanityEnv();
    if (!env.projectId) throw new Error("Missing NEXT_PUBLIC_SANITY_PROJECT_ID");
    const url = new URL(
      `https://${env.projectId}.apicdn.sanity.io/v${env.apiVersion}/data/query/${env.dataset}`,
    );
    url.searchParams.set("query", groq);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(`$${key}`, JSON.stringify(value));
    }

    const res = await retry(
      async () => {
        const r = await fetchWithTimeout(url.toString(), { headers: { Accept: "application/json" } });
        if (!r.ok) throw new HttpError(r.status, url.toString(), null, `Sanity query: ${r.status}`);
        return r;
      },
      { retries: 3, isRetryable: isRetryableError },
    );
    const json = (await res.json()) as { result: T };
    return json.result;
  },
};
