import { readShopifyEnv } from "./env";

export interface AdminClient {
  request<T>(query: string, variables?: Record<string, unknown>): Promise<T>;
}

interface GraphQLResponse<T> {
  data?: T;
  errors?: unknown;
}

/**
 * Shopify Admin GraphQL client. SERVER-ONLY — uses the Admin access token.
 * Only call from Route Handlers and Inngest functions (e.g. lazily creating a
 * Shopify customer for the user_profiles identity bridge). Never import into a
 * client component.
 */
export const admin: AdminClient = {
  async request<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
    const env = readShopifyEnv();
    const endpoint = `https://${env.storeDomain}/admin/api/${env.adminApiVersion}/graphql.json`;

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": env.adminAccessToken,
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!res.ok) {
      throw new Error(`Shopify Admin error: ${res.status} ${res.statusText}`);
    }

    const json = (await res.json()) as GraphQLResponse<T>;
    if (json.errors) {
      throw new Error(`Shopify Admin GraphQL: ${JSON.stringify(json.errors)}`);
    }
    if (!json.data) throw new Error("Shopify Admin: empty response");
    return json.data;
  },
};
