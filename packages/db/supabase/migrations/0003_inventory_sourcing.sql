-- 0003_inventory_sourcing.sql — inventory & sourcing (docs/DATA-MODEL.md §5).
-- Shopify is authoritative for sellable quantity; these tables add the
-- distributor-grade sourcing fields (lead time, MOQ, supplier costs).

create table locations (
  id      uuid primary key default gen_random_uuid(),
  code    text not null unique,               -- 'WH-US-EAST'
  name    text not null,
  country text
);

create table inventory (
  variant_id     uuid not null references product_variants(id) on delete cascade,
  location_id    uuid not null references locations(id),
  quantity       int not null default 0,       -- mirror of Shopify available
  on_order       int not null default 0,
  reorder_point  int,
  lead_time_days int,                           -- for custom/industrial
  moq            int,                           -- minimum order qty
  updated_at     timestamptz not null default now(),
  primary key (variant_id, location_id)
);

create table suppliers (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  code          text unique,
  contact_email text,
  lead_time_days int,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

create table supplier_products (
  id              uuid primary key default gen_random_uuid(),
  supplier_id     uuid not null references suppliers(id) on delete cascade,
  product_id      uuid references products(id) on delete set null,
  variant_id      uuid references product_variants(id) on delete set null,
  supplier_sku    text not null,
  mfr_part_number text,
  unit_cost       numeric(12,4),
  currency        text default 'USD',
  moq             int,
  pack_qty        int,
  lead_time_days  int,
  is_preferred    boolean not null default false,
  updated_at      timestamptz not null default now(),
  unique (supplier_id, supplier_sku)
);
