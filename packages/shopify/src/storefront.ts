import { readShopifyEnv } from "./env";
import { graphqlRequest } from "./request";

export interface StorefrontClient {
  request<T>(query: string, variables?: Record<string, unknown>): Promise<T>;
}

/**
 * Shopify Storefront GraphQL client. Uses the PUBLIC storefront token, so it is
 * safe to call from RSC. Resilient transport (timeout + retry) lives in
 * ./request. Replace hand-rolled queries with codegen'd operations in Phase 2+.
 */
export const storefront: StorefrontClient = {
  async request<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
    const env = readShopifyEnv();
    return graphqlRequest<T>({
      endpoint: `https://${env.storeDomain}/api/${env.storefrontApiVersion}/graphql.json`,
      token: env.storefrontPublicToken,
      tokenHeader: "X-Shopify-Storefront-Access-Token",
      query,
      variables,
      label: "Shopify Storefront",
    });
  },
};
