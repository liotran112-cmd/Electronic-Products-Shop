export { createAnonClient, createServiceClient } from "./client";
export {
  upsertProductMirror,
  loadProductForIndex,
  findProductIdByShopifyId,
  findShopifyIdByProductId,
  findProductByHandle,
  recordSyncEvent,
  listFailedSyncEvents,
  syncStats,
  type ProductMirrorInput,
  type VariantMirrorInput,
  type ProductIndexData,
  type SyncEventInput,
} from "./queries";
export type { Database, Json, ProductStatus, ProductKind, SyncStatus } from "./types";
