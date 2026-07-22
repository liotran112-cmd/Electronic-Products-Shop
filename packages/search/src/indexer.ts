import type { Algoliasearch } from "algoliasearch";

import { INDEX } from "./constants";
import type { ProductSearchRecord } from "./merge";

/** Upsert product records into the primary index (replicas inherit). SERVER-ONLY. */
export async function indexProducts(
  admin: Algoliasearch,
  records: ProductSearchRecord[],
): Promise<void> {
  if (records.length === 0) return;
  await admin.saveObjects({
    indexName: INDEX.products,
    objects: records as unknown as Array<Record<string, unknown>>,
  });
}

/** Remove products from the index by objectID (= Shopify product GID). SERVER-ONLY. */
export async function deleteProducts(admin: Algoliasearch, objectIDs: string[]): Promise<void> {
  if (objectIDs.length === 0) return;
  await admin.deleteObjects({ indexName: INDEX.products, objectIDs });
}
