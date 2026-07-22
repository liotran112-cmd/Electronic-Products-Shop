import type { ProductSummary, Quote } from "@repo/domain";

import { NotFoundError, UnauthenticatedError } from "../errors";
import { toQuote } from "../mappers/account.mapper";
import { rowToSummary } from "../mappers/summary.mapper";
import * as account from "../repositories/account.repo";
import * as catalog from "../repositories/catalog.repo";

/** Per-user, RLS-scoped, NEVER cached. RLS guarantees owner-only access. */
export async function getQuoteDetails(reference: string): Promise<Quote> {
  const db = await account.getAuthedClient();
  const user = await account.getCurrentUser(db);
  if (!user) throw new UnauthenticatedError();

  const result = await account.getQuoteByReference(db, reference);
  if (!result) throw new NotFoundError("quote", reference);

  const productIds = result.items
    .map((i) => i.product_id)
    .filter((id): id is string => id !== null);
  const summaries = await catalog.getProductRowsByIds(productIds);
  const byId = new Map<string, ProductSummary>(summaries.map((s) => [s.id, rowToSummary(s)]));

  return toQuote(result.quote, result.items, byId);
}
