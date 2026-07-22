import { fetchWithTimeout, HttpError, isRetryableError, retry } from "@repo/core";

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string }> | unknown;
}

export interface GraphqlRequestOptions {
  endpoint: string;
  token: string;
  tokenHeader: string;
  query: string;
  variables?: Record<string, unknown>;
  label: string;
  timeoutMs?: number;
}

/**
 * Shared Shopify GraphQL transport: hard timeout, retry with backoff on
 * transient failures (network/timeout/429/5xx), and honors Retry-After so we
 * respect Shopify's rate limits instead of hammering (ARCHITECTURE §9/§10).
 */
export async function graphqlRequest<T>(opts: GraphqlRequestOptions): Promise<T> {
  const { endpoint, token, tokenHeader, query, variables = {}, label, timeoutMs = 10_000 } = opts;

  const res = await retry(
    async () => {
      const r = await fetchWithTimeout(
        endpoint,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", [tokenHeader]: token },
          body: JSON.stringify({ query, variables }),
        },
        timeoutMs,
      );
      if (!r.ok) {
        const retryAfter = r.headers.get("retry-after");
        const retryAfterMs = retryAfter ? Number(retryAfter) * 1000 : null;
        throw new HttpError(r.status, endpoint, retryAfterMs, `${label}: ${r.status} ${r.statusText}`);
      }
      return r;
    },
    {
      retries: 3,
      isRetryable: isRetryableError,
      retryDelay: (error) => (error instanceof HttpError ? error.retryAfterMs : null),
    },
  );

  const json = (await res.json()) as GraphQLResponse<T>;
  const errs = json.errors;
  if (Array.isArray(errs) ? errs.length > 0 : Boolean(errs)) {
    throw new Error(`${label} GraphQL error: ${JSON.stringify(errs)}`);
  }
  if (!json.data) throw new Error(`${label}: empty response`);
  return json.data;
}
