/**
 * Hand-written database types for the tables the sync pipeline touches
 * (migrations 0001/0002). INTERIM: run `pnpm --filter @repo/db gen:types`
 * against a local Supabase to replace this with the full generated schema, then
 * re-export `Database` from `types.gen.ts`.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ProductStatus = "draft" | "active" | "archived" | "eol";
export type ProductKind = "consumer" | "custom";

export interface BrandsTable {
  Row: {
    id: string;
    slug: string;
    name: string;
    logo_url: string | null;
    website: string | null;
    description: string | null;
    is_active: boolean;
    created_at: string;
  };
  Insert: {
    id?: string;
    slug: string;
    name: string;
    logo_url?: string | null;
    website?: string | null;
    description?: string | null;
    is_active?: boolean;
    created_at?: string;
  };
  Update: Partial<BrandsTable["Insert"]>;
  Relationships: [];
}

export interface CategoriesTable {
  Row: {
    id: string;
    parent_id: string | null;
    slug: string;
    name: string;
    path: string;
    depth: number;
    sort: number;
    icon_url: string | null;
    is_active: boolean;
  };
  Insert: {
    id?: string;
    parent_id?: string | null;
    slug: string;
    name: string;
    path: string;
    depth?: number;
    sort?: number;
    icon_url?: string | null;
    is_active?: boolean;
  };
  Update: Partial<CategoriesTable["Insert"]>;
  Relationships: [];
}

export interface ProductsTable {
  Row: {
    id: string;
    shopify_product_id: string | null;
    handle: string;
    title: string;
    subtitle: string | null;
    brand_id: string | null;
    primary_category_id: string | null;
    kind: ProductKind;
    status: ProductStatus;
    mpn: string | null;
    gtin: string | null;
    short_description: string | null;
    hero_image_url: string | null;
    specs: Json;
    is_quotable: boolean;
    rating_avg: number | null;
    rating_count: number;
    published_at: string | null;
    synced_at: string | null;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    shopify_product_id?: string | null;
    handle: string;
    title: string;
    subtitle?: string | null;
    brand_id?: string | null;
    primary_category_id?: string | null;
    kind?: ProductKind;
    status?: ProductStatus;
    mpn?: string | null;
    gtin?: string | null;
    short_description?: string | null;
    hero_image_url?: string | null;
    specs?: Json;
    is_quotable?: boolean;
    rating_avg?: number | null;
    rating_count?: number;
    published_at?: string | null;
    synced_at?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Update: Partial<ProductsTable["Insert"]>;
  Relationships: [];
}

export interface ProductVariantsTable {
  Row: {
    id: string;
    product_id: string;
    shopify_variant_id: string | null;
    sku: string;
    title: string | null;
    option_values: Json;
    price_snapshot: number | null;
    currency: string | null;
    weight_grams: number | null;
    barcode: string | null;
    position: number;
    is_active: boolean;
  };
  Insert: {
    id?: string;
    product_id: string;
    shopify_variant_id?: string | null;
    sku: string;
    title?: string | null;
    option_values?: Json;
    price_snapshot?: number | null;
    currency?: string | null;
    weight_grams?: number | null;
    barcode?: string | null;
    position?: number;
    is_active?: boolean;
  };
  Update: Partial<ProductVariantsTable["Insert"]>;
  Relationships: [];
}

export type SyncStatus = "indexed" | "deindexed" | "skipped" | "failed";

export interface SyncEventsTable {
  Row: {
    id: number;
    correlation_id: string | null;
    entity: string;
    entity_ref: string | null;
    event: string;
    status: SyncStatus;
    attempts: number;
    duration_ms: number | null;
    error: string | null;
    created_at: string;
  };
  Insert: {
    id?: number;
    correlation_id?: string | null;
    entity?: string;
    entity_ref?: string | null;
    event: string;
    status: SyncStatus;
    attempts?: number;
    duration_ms?: number | null;
    error?: string | null;
    created_at?: string;
  };
  Update: Partial<SyncEventsTable["Insert"]>;
  Relationships: [];
}

export interface Database {
  public: {
    Tables: {
      brands: BrandsTable;
      categories: CategoriesTable;
      products: ProductsTable;
      product_variants: ProductVariantsTable;
      sync_events: SyncEventsTable;
    };
    Views: Record<string, never>;
    Functions: {
      category_trail: {
        Args: { p_category: string };
        Returns: string[];
      };
    };
    Enums: {
      product_status: ProductStatus;
      product_kind: ProductKind;
      sync_status: SyncStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}
