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

// ── Read-side tables (subset used by the BFF; full set via gen:types) ────

export interface DocumentsTable {
  Row: {
    id: string;
    product_id: string;
    doc_type: "manual" | "datasheet" | "certificate" | "cad" | "guide" | "schematic";
    title: string;
    url: string;
    language: string | null;
    version: string | null;
    size_bytes: number | null;
    is_public: boolean;
    published_at: string | null;
  };
  Insert: Partial<DocumentsTable["Row"]> & { product_id: string; doc_type: DocumentsTable["Row"]["doc_type"]; title: string; url: string };
  Update: Partial<DocumentsTable["Row"]>;
  Relationships: [];
}

export interface CompatibilityTable {
  Row: {
    id: string;
    product_id: string;
    target_kind: "product" | "platform" | "standard" | "protocol" | "ecosystem";
    target_product_id: string | null;
    target_name: string | null;
    notes: string | null;
    verified: boolean;
  };
  Insert: Partial<CompatibilityTable["Row"]> & { product_id: string; target_kind: CompatibilityTable["Row"]["target_kind"] };
  Update: Partial<CompatibilityTable["Row"]>;
  Relationships: [];
}

export interface UserProfilesTable {
  Row: {
    id: string;
    shopify_customer_id: string | null;
    company: string | null;
    role: string | null;
    b2b_account_id: string | null;
    created_at: string;
  };
  Insert: Partial<UserProfilesTable["Row"]> & { id: string };
  Update: Partial<UserProfilesTable["Row"]>;
  Relationships: [];
}

export interface WishlistsTable {
  Row: { id: string; user_id: string; product_id: string; added_at: string };
  Insert: Partial<WishlistsTable["Row"]> & { user_id: string; product_id: string };
  Update: Partial<WishlistsTable["Row"]>;
  Relationships: [];
}

export interface DeviceOwnershipTable {
  Row: { user_id: string; product_id: string; serial: string | null; registered_at: string };
  Insert: Partial<DeviceOwnershipTable["Row"]> & { user_id: string; product_id: string };
  Update: Partial<DeviceOwnershipTable["Row"]>;
  Relationships: [];
}

export interface QuoteRequestsTable {
  Row: {
    id: string;
    reference: string;
    user_id: string | null;
    company: string | null;
    contact_email: string;
    status: "new" | "reviewing" | "quoted" | "negotiation" | "accepted" | "won" | "lost" | "cancelled";
    created_at: string;
  };
  Insert: Partial<QuoteRequestsTable["Row"]> & { reference: string; contact_email: string };
  Update: Partial<QuoteRequestsTable["Row"]>;
  Relationships: [];
}

export interface QuoteItemsTable {
  Row: {
    id: string;
    quote_id: string;
    product_id: string | null;
    description: string;
    quantity: number;
    target_price: number | null;
  };
  Insert: Partial<QuoteItemsTable["Row"]> & { quote_id: string; description: string };
  Update: Partial<QuoteItemsTable["Row"]>;
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
      documents: DocumentsTable;
      compatibility: CompatibilityTable;
      user_profiles: UserProfilesTable;
      wishlists: WishlistsTable;
      device_ownership: DeviceOwnershipTable;
      quote_requests: QuoteRequestsTable;
      quote_items: QuoteItemsTable;
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
