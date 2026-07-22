import { readShopifyEnv } from "./env";
import { graphqlRequest } from "./request";

export interface AdminClient {
  request<T>(query: string, variables?: Record<string, unknown>): Promise<T>;
}

/**
 * Shopify Admin GraphQL client. SERVER-ONLY — uses the Admin access token.
 * Only call from Route Handlers and Inngest functions. Resilient transport
 * (timeout + retry + Retry-After) lives in ./request.
 */
export const admin: AdminClient = {
  async request<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
    const env = readShopifyEnv();
    return graphqlRequest<T>({
      endpoint: `https://${env.storeDomain}/admin/api/${env.adminApiVersion}/graphql.json`,
      token: env.adminAccessToken,
      tokenHeader: "X-Shopify-Access-Token",
      query,
      variables,
      label: "Shopify Admin",
    });
  },
};
