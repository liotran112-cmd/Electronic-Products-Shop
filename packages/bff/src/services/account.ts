import type { CustomerDashboard, ProductSummary, Quote, RecentlyViewed } from "@repo/domain";

import { UnauthenticatedError } from "../errors";
import { rowToSummary } from "../mappers/summary.mapper";
import { toDashboard, toDevice } from "../mappers/account.mapper";
import * as account from "../repositories/account.repo";
import * as catalog from "../repositories/catalog.repo";
import * as commerce from "../repositories/commerce.repo";

/** Per-user, RLS-scoped, NEVER cached. */
export async function getCustomerDashboard(): Promise<CustomerDashboard> {
  const db = await account.getAuthedClient();
  const user = await account.getCurrentUser(db);
  if (!user) throw new UnauthenticatedError();

  const [profile, savedIds, deviceRows, quoteRows] = await Promise.all([
    account.getProfile(db, user.id),
    account.getSavedProductIds(db, user.id),
    account.getDevices(db, user.id),
    account.getUserQuotes(db, user.id),
  ]);

  const productIds = [...new Set([...savedIds, ...deviceRows.map((d) => d.product_id)])];
  const summaries = await catalog.getProductRowsByIds(productIds);
  const byId = new Map(summaries.map((s) => [s.id, rowToSummary(s)] as const));

  const saved = savedIds
    .map((id) => byId.get(id))
    .filter((s): s is ProductSummary => s !== undefined);
  const devices = deviceRows.map((d) => toDevice(d, byId));
  const orders = await commerce.getCustomerOrders();
  const quotes: Quote[] = quoteRows.map((q) => ({
    reference: q.reference,
    status: q.status,
    createdAt: q.created_at,
    items: [],
  }));

  return toDashboard({ email: user.email, company: profile?.company, orders, saved, quotes, devices });
}

/** Ids come from the client (cookie/localStorage); resolved to summaries. */
export async function getRecentlyViewed(handles: string[]): Promise<RecentlyViewed> {
  const rows = await catalog.getProductRowsByHandles(handles.slice(0, 12));
  const byHandle = new Map(rows.map((r) => [r.handle, rowToSummary(r)] as const));
  return {
    items: handles
      .map((h) => byHandle.get(h))
      .filter((s): s is ProductSummary => s !== undefined),
  };
}
