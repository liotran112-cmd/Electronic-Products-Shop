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
 * Placeholder GROQ client over the public query API (CDN). Swap for
 * `@sanity/client` once the package is added; kept dependency-free for the
 * Phase 1 scaffold so the workspace installs without external SDKs.
 */
export const sanity: SanityClient = {
  async fetch<T>(groq: string, params: Record<string, unknown> = {}): Promise<T> {
    const env = readSanityEnv();
    if (!env.projectId) throw new Error("Missing NEXT_PUBLIC_SANITY_PROJECT_ID");
    const url = new URL(
      `https://${env.projectId}.apicdn.sanity.io/v${env.apiVersion}/data/query/${env.dataset}`,
    );
    url.searchParams.set("query", groq);
    url.searchParams.set("$params", JSON.stringify(params));

    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`Sanity query error: ${res.status}`);
    const json = (await res.json()) as { result: T };
    return json.result;
  },
};
