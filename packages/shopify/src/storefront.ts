import { readShopifyEnv } from "./env";

export interface StorefrontClient {
  request<T>(query: string, variables?: Record<string, unknown>): Promise<T>;
}

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

/**
 * Minimal Shopify Storefront GraphQL client. Uses the PUBLIC storefront token,
 * so it is safe to call from RSC and (with the same token) the browser.
 * Replace the hand-rolled fetch with codegen'd typed operations in Phase 2.
 */
export const storefront: StorefrontClient = {
  async request<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
    const env = readShopifyEnv();
    const endpoint = `https://${env.storeDomain}/api/${env.storefrontApiVersion}/graphql.json`;

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": env.storefrontPublicToken,
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!res.ok) {
      throw new Error(`Shopify Storefront error: ${res.status} ${res.statusText}`);
    }

    const json = (await res.json()) as GraphQLResponse<T>;
    if (json.errors?.length) {
      throw new Error(`Shopify Storefront GraphQL: ${json.errors.map((e) => e.message).join("; ")}`);
    }
    if (!json.data) throw new Error("Shopify Storefront: empty response");
    return json.data;
  },
};
