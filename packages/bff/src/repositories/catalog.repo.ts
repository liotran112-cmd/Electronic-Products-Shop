import { createServiceClient } from "@repo/db";

/**
 * Supabase catalog reads (server-only, trusted). Public reads filter to active
 * status explicitly. This is the ONLY module allowed to import @repo/db for
 * catalog data. Returns source-shaped fragments — never domain models.
 */

export interface CatalogVariant {
  id: string;
  shopifyVariantId: string | null;
  sku: string;
  title: string | null;
  optionValues: Record<string, string>;
  priceSnapshot: number | null;
  currency: string;
  position: number;
}

export interface CatalogDocument {
  id: string;
  docType: "manual" | "datasheet" | "certificate" | "cad" | "guide" | "schematic";
  title: string;
  url: string;
  language: string | null;
  version: string | null;
  sizeBytes: number | null;
}

export interface CatalogProduct {
  id: string;
  handle: string;
  title: string;
  subtitle: string | null;
  status: string;
  kind: string;
  mpn: string | null;
  heroImageUrl: string | null;
  specs: Record<string, unknown>;
  ratingAvg: number | null;
  ratingCount: number;
  isQuotable: boolean;
  brand: { name: string; slug: string; logoUrl: string | null } | null;
  primaryCategory: { name: string; slug: string } | null;
  categoryTrail: string[];
  variants: CatalogVariant[];
  documents: CatalogDocument[];
  compatibility: Array<{ label: string; targetProductId: string | null }>;
}

export async function getCatalogProduct(handle: string): Promise<CatalogProduct | null> {
  const db = createServiceClient();
  const { data: p } = await db
    .from("products")
    .select(
      "id, handle, title, subtitle, status, kind, mpn, hero_image_url, specs, rating_avg, rating_count, is_quotable, brand_id, primary_category_id",
    )
    .eq("handle", handle)
    .maybeSingle();
  if (!p) return null;

  const [variantsRes, brandRes, categoryRes, trailRes, docsRes, compatRes] = await Promise.all([
    db
      .from("product_variants")
      .select("id, shopify_variant_id, sku, title, option_values, price_snapshot, currency, position")
      .eq("product_id", p.id)
      .order("position"),
    p.brand_id
      ? db.from("brands").select("name, slug, logo_url").eq("id", p.brand_id).maybeSingle()
      : Promise.resolve({ data: null }),
    p.primary_category_id
      ? db.from("categories").select("name, slug").eq("id", p.primary_category_id).maybeSingle()
      : Promise.resolve({ data: null }),
    p.primary_category_id
      ? db.rpc("category_trail", { p_category: p.primary_category_id })
      : Promise.resolve({ data: [] as string[] }),
    db
      .from("documents")
      .select("id, doc_type, title, url, language, version, size_bytes")
      .eq("product_id", p.id)
      .eq("is_public", true),
    db
      .from("compatibility")
      .select("target_kind, target_name, target_product_id")
      .eq("product_id", p.id),
  ]);

  return {
    id: p.id,
    handle: p.handle,
    title: p.title,
    subtitle: p.subtitle,
    status: p.status,
    kind: p.kind,
    mpn: p.mpn,
    heroImageUrl: p.hero_image_url,
    specs: (p.specs ?? {}) as Record<string, unknown>,
    ratingAvg: p.rating_avg,
    ratingCount: p.rating_count,
    isQuotable: p.is_quotable,
    brand: brandRes.data
      ? { name: brandRes.data.name, slug: brandRes.data.slug, logoUrl: brandRes.data.logo_url }
      : null,
    primaryCategory: categoryRes.data
      ? { name: categoryRes.data.name, slug: categoryRes.data.slug }
      : null,
    categoryTrail: trailRes.data ?? [],
    variants: (variantsRes.data ?? []).map((v) => ({
      id: v.id,
      shopifyVariantId: v.shopify_variant_id,
      sku: v.sku,
      title: v.title,
      optionValues: (v.option_values ?? {}) as Record<string, string>,
      priceSnapshot: v.price_snapshot,
      currency: v.currency ?? "USD",
      position: v.position,
    })),
    documents: (docsRes.data ?? []).map((d) => ({
      id: d.id,
      docType: d.doc_type,
      title: d.title,
      url: d.url,
      language: d.language,
      version: d.version,
      sizeBytes: d.size_bytes,
    })),
    compatibility: (compatRes.data ?? []).map((c) => ({
      label: c.target_name ?? "",
      targetProductId: c.target_product_id,
    })),
  };
}

export async function getCategoryBySlug(slug: string) {
  const db = createServiceClient();
  const { data } = await db
    .from("categories")
    .select("id, name, slug")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  return data;
}

export async function getBrandBySlug(slug: string) {
  const db = createServiceClient();
  const { data } = await db
    .from("brands")
    .select("id, name, slug, logo_url, description")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  return data;
}

export async function listRootCategories() {
  const db = createServiceClient();
  const { data } = await db
    .from("categories")
    .select("name, slug, icon_url")
    .eq("depth", 0)
    .eq("is_active", true)
    .order("sort");
  return data ?? [];
}

export async function listActiveBrands(limit = 24) {
  const db = createServiceClient();
  const { data } = await db
    .from("brands")
    .select("name, slug, logo_url")
    .eq("is_active", true)
    .order("name")
    .limit(limit);
  return data ?? [];
}

/** Minimal product rows for summaries (dashboard saved products, recently viewed). */
export interface SummaryRow {
  id: string;
  handle: string;
  title: string;
  brand: string;
  heroImageUrl: string | null;
  specs: Record<string, unknown>;
  ratingAvg: number | null;
  ratingCount: number;
  price: number | null;
  currency: string;
}

const SUMMARY_COLS =
  "id, handle, title, hero_image_url, specs, rating_avg, rating_count, brand_id";

type RawSummary = {
  id: string;
  handle: string;
  title: string;
  hero_image_url: string | null;
  specs: unknown;
  rating_avg: number | null;
  rating_count: number;
  brand_id: string | null;
};

async function assembleSummaries(
  db: ReturnType<typeof createServiceClient>,
  rows: RawSummary[],
): Promise<SummaryRow[]> {
  const ids = rows.map((r) => r.id);
  const brandIds = [...new Set(rows.map((r) => r.brand_id).filter((b): b is string => b !== null))];

  const [{ data: variants }, { data: brands }] = await Promise.all([
    db.from("product_variants").select("product_id, price_snapshot, currency").in("product_id", ids),
    brandIds.length
      ? db.from("brands").select("id, name").in("id", brandIds)
      : Promise.resolve({ data: [] as Array<{ id: string; name: string }> }),
  ]);

  const brandName = new Map((brands ?? []).map((b) => [b.id, b.name]));
  const minPrice = new Map<string, { price: number; currency: string }>();
  for (const v of variants ?? []) {
    if (v.price_snapshot == null) continue;
    const current = minPrice.get(v.product_id);
    if (!current || v.price_snapshot < current.price) {
      minPrice.set(v.product_id, { price: v.price_snapshot, currency: v.currency ?? "USD" });
    }
  }

  return rows.map((r) => {
    const price = minPrice.get(r.id);
    return {
      id: r.id,
      handle: r.handle,
      title: r.title,
      brand: r.brand_id ? (brandName.get(r.brand_id) ?? "") : "",
      heroImageUrl: r.hero_image_url,
      specs: (r.specs ?? {}) as Record<string, unknown>,
      ratingAvg: r.rating_avg,
      ratingCount: r.rating_count,
      price: price?.price ?? null,
      currency: price?.currency ?? "USD",
    };
  });
}

export async function getProductRowsByHandles(handles: string[]): Promise<SummaryRow[]> {
  if (handles.length === 0) return [];
  const db = createServiceClient();
  const { data } = await db
    .from("products")
    .select(SUMMARY_COLS)
    .in("handle", handles)
    .eq("status", "active");
  return assembleSummaries(db, data ?? []);
}

export async function getProductRowsByIds(ids: string[]): Promise<SummaryRow[]> {
  if (ids.length === 0) return [];
  const db = createServiceClient();
  const { data } = await db
    .from("products")
    .select(SUMMARY_COLS)
    .in("id", ids)
    .eq("status", "active");
  return assembleSummaries(db, data ?? []);
}
