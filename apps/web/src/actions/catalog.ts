"use server";

import {
  getCustomerDashboard,
  getRecentlyViewed,
  searchProducts,
  type CustomerDashboard,
  type RecentlyViewed,
  type SearchParams,
  type SearchResult,
} from "@repo/bff";

/**
 * Server Actions — the ONLY bridge from client hooks to the BFF. Client code
 * never imports a source SDK (ESLint-enforced); it calls these.
 */

export async function searchAction(params: SearchParams): Promise<SearchResult> {
  return searchProducts(params);
}

export async function recentlyViewedAction(handles: string[]): Promise<RecentlyViewed> {
  return getRecentlyViewed(handles);
}

export async function customerDashboardAction(): Promise<CustomerDashboard | null> {
  try {
    return await getCustomerDashboard();
  } catch {
    // Unauthenticated or upstream issue → let the UI render a signed-out state.
    return null;
  }
}
