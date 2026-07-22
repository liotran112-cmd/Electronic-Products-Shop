-- 0001_catalog.sql — extensions, taxonomy, product & variant mirror.
-- Canonical schema: docs/DATA-MODEL.md §3 (supersedes ARCHITECTURE §6).
-- The `products` / `product_variants` rows are a DERIVED mirror of Shopify —
-- written only by the sync pipeline (service_role), never hand-authored.

create extension if not exists ltree;
create extension if not exists pg_trgm;

-- BRAND -----------------------------------------------------------
create table brands (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  name         text not null,
  logo_url     text,                          -- Cloudinary
  website      text,
  description  text,                           -- short; rich copy lives in Sanity
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);

-- CATEGORY (hierarchical, Digi-Key-style deep taxonomy) -----------
create table categories (
  id           uuid primary key default gen_random_uuid(),
  parent_id    uuid references categories(id) on delete restrict,
  slug         text not null unique,
  name         text not null,
  path         ltree not null,                -- e.g. root.dev_boards.mcu_boards
  depth        int  not null default 0,
  sort         int  not null default 0,
  icon_url     text,
  is_active    boolean not null default true
);

-- PRODUCT (mirror of Shopify + our catalog metadata) --------------
create type product_status as enum ('draft','active','archived','eol');
create type product_kind   as enum ('consumer','custom');

create table products (
  id                  uuid primary key default gen_random_uuid(),
  shopify_product_id  text unique,             -- gid://shopify/Product/... (null for quote-only custom)
  handle              text not null unique,
  title               text not null,
  subtitle            text,
  brand_id            uuid references brands(id),
  primary_category_id uuid references categories(id),
  kind                product_kind not null default 'consumer',
  status              product_status not null default 'draft',
  mpn                 text,                     -- manufacturer part number
  gtin                text,                     -- UPC/EAN
  short_description   text,                     -- body/rich content in Sanity
  hero_image_url      text,                     -- Cloudinary
  specs               jsonb not null default '{}',    -- GENERATED projection (see 0009)
  is_quotable         boolean not null default false, -- custom devices -> quote flow
  rating_avg          numeric(2,1),             -- denormalized from reviews app
  rating_count        int not null default 0,
  published_at        timestamptz,
  synced_at           timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- secondary categories (a product lives in one primary + many facets)
create table product_categories (
  product_id  uuid references products(id) on delete cascade,
  category_id uuid references categories(id) on delete cascade,
  primary key (product_id, category_id)
);

-- VARIANT (mirror of Shopify variants) ----------------------------
create table product_variants (
  id                  uuid primary key default gen_random_uuid(),
  product_id          uuid not null references products(id) on delete cascade,
  shopify_variant_id  text unique,
  sku                 text not null,
  title               text,                    -- "256GB / Graphite"
  option_values       jsonb not null default '{}', -- {"Storage":"256GB","Color":"Graphite"}
  price_snapshot      numeric(12,2),           -- DISPLAY ONLY; Shopify authoritative
  currency            text default 'USD',
  weight_grams        int,
  barcode             text,
  position            int not null default 0,
  is_active           boolean not null default true
);
