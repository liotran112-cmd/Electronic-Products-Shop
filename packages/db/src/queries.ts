import { type SupabaseClient } from "@supabase/supabase-js";

import type { Database, ProductStatus } from "./types";

type DB = SupabaseClient<Database>;

/** Shopify-owned fields written by the sync mirror (never specs/brand/category). */
export interface ProductMirrorInput {
  shopifyProductId: string;
  handle: string;
  title: string;
  status: Extract<ProductStatus, "active" | "draft" | "archived">;
  heroImageUrl: string | null;
}

export interface VariantMirrorInput {
  shopifyVariantId: string;
  sku: string;
  title: string | null;
  optionValues: Record<string, string>;
  priceSnapshot: number | null;
  currency: string;
  position: number;
}

/**
 * Upsert the Shopify-owned columns of a product + its variants. Deliberately
 * does NOT touch `specs`, `brand_id`, `primary_category_id`, `mpn` — those are
 * Supabase-owned catalog metadata (DATA-MODEL §3). Returns the Supabase row id.
 */
export async function upsertProductMirror(
  db: DB,
  product: ProductMirrorInput,
  variants: VariantMirrorInput[],
): Promise<string> {
  const { data, error } = await db
    .from("products")
    .upsert(
      {
        shopify_product_id: product.shopifyProductId,
        handle: product.handle,
        title: product.title,
        status: product.status,
        hero_image_url: product.heroImageUrl,
        synced_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "shopify_product_id" },
    )
    .select("id")
    .single();

  if (error) throw new Error(`upsertProductMirror(products): ${error.message}`);
  const productId = data.id;

  if (variants.length > 0) {
    const { error: vErr } = await db.from("product_variants").upsert(
      variants.map((v) => ({
        product_id: productId,
        shopify_variant_id: v.shopifyVariantId,
        sku: v.sku,
        title: v.title,
        option_values: v.optionValues,
        price_snapshot: v.priceSnapshot,
        currency: v.currency,
        position: v.position,
      })),
      { onConflict: "shopify_variant_id" },
    );
    if (vErr) throw new Error(`upsertProductMirror(variants): ${vErr.message}`);
  }

  return productId;
}

/** Assembled catalog facts for the Algolia merge (Supabase side). */
export interface ProductIndexData {
  id: string;
  shopifyProductId: string | null;
  handle: string;
  mpn: string | null;
  brandName: string | null;
  categoryTrail: string[];
  ratingAvg: number | null;
  ratingCount: number;
  specs: Record<string, unknown>;
}

/**
 * Ancestor display-names root→leaf in ONE query via the `category_trail` ltree
 * function — replaces the per-level parent walk (was N+1: up to 8 queries per
 * product → ~100k for a 10k full reindex).
 */
async function loadCategoryTrail(db: DB, categoryId: string | null): Promise<string[]> {
  if (!categoryId) return [];
  const { data, error } = await db.rpc("category_trail", { p_category: categoryId });
  if (error || !data) return [];
  return data;
}

/** Load a product (specs projection + brand + category trail) for reindexing. */
export async function loadProductForIndex(db: DB, productId: string): Promise<ProductIndexData> {
  const { data: product, error } = await db
    .from("products")
    .select(
      "id, shopify_product_id, handle, mpn, brand_id, primary_category_id, rating_avg, rating_count, specs",
    )
    .eq("id", productId)
    .single();
  if (error || !product) throw new Error(`loadProductForIndex: product ${productId} not found`);

  let brandName: string | null = null;
  if (product.brand_id) {
    const { data: brand } = await db
      .from("brands")
      .select("name")
      .eq("id", product.brand_id)
      .single();
    brandName = brand?.name ?? null;
  }

  const categoryTrail = await loadCategoryTrail(db, product.primary_category_id);

  return {
    id: product.id,
    shopifyProductId: product.shopify_product_id,
    handle: product.handle,
    mpn: product.mpn,
    brandName,
    categoryTrail,
    ratingAvg: product.rating_avg,
    ratingCount: product.rating_count,
    specs: (product.specs ?? {}) as Record<string, unknown>,
  };
}

/** Resolve a Supabase product id from a Shopify product GID (for spec/sanity events). */
export async function findProductIdByShopifyId(
  db: DB,
  shopifyProductId: string,
): Promise<string | null> {
  const { data } = await db
    .from("products")
    .select("id")
    .eq("shopify_product_id", shopifyProductId)
    .single();
  return data?.id ?? null;
}

/** Resolve a Shopify product GID from a Supabase product id (for specs.updated events). */
export async function findShopifyIdByProductId(
  db: DB,
  productId: string,
): Promise<string | null> {
  const { data } = await db
    .from("products")
    .select("shopify_product_id")
    .eq("id", productId)
    .single();
  return data?.shopify_product_id ?? null;
}

/** Resolve a product by handle (for sanity editorial events). */
export async function findProductByHandle(
  db: DB,
  handle: string,
): Promise<{ id: string; shopify_product_id: string | null } | null> {
  const { data } = await db
    .from("products")
    .select("id, shopify_product_id")
    .eq("handle", handle)
    .single();
  return data ?? null;
}

// ── Operations: sync history + dead-letter (audit §3/§7) ──────────

export interface SyncEventInput {
  correlationId?: string | null;
  entityRef?: string | null;
  event: "reindex" | "deindex";
  status: "indexed" | "deindexed" | "skipped" | "failed";
  attempts?: number;
  durationMs?: number | null;
  error?: string | null;
}

/** Record a pipeline outcome. Best-effort: never throws (observability must not break the pipeline). */
export async function recordSyncEvent(db: DB, input: SyncEventInput): Promise<void> {
  try {
    await db.from("sync_events").insert({
      correlation_id: input.correlationId ?? null,
      entity: "product",
      entity_ref: input.entityRef ?? null,
      event: input.event,
      status: input.status,
      attempts: input.attempts ?? 1,
      duration_ms: input.durationMs ?? null,
      error: input.error ?? null,
    });
  } catch {
    // swallow — recording history must never fail the pipeline
  }
}

/** Recent failures (dead-letter view) for ops tooling / health checks. */
export async function listFailedSyncEvents(db: DB, limit = 50) {
  const { data, error } = await db
    .from("sync_events")
    .select("*")
    .eq("status", "failed")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`listFailedSyncEvents: ${error.message}`);
  return data;
}

/** Sync statistics over a recent window for the health endpoint. */
export async function syncStats(db: DB, sinceIso: string) {
  const { data, error } = await db
    .from("sync_events")
    .select("status")
    .gte("created_at", sinceIso);
  if (error) throw new Error(`syncStats: ${error.message}`);
  const counts: Record<string, number> = {};
  for (const row of data) counts[row.status] = (counts[row.status] ?? 0) + 1;
  return counts;
}
