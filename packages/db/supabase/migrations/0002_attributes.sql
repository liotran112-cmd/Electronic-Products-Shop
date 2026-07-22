-- 0002_attributes.sql — flexible attribute system (docs/DATA-MODEL.md §4).
-- Three concepts: attribute (definition) / options (canonical enum members) /
-- specification (a product's value). Normalized rows are CANONICAL; the
-- products.specs JSONB is a generated projection (see 0009).

create type attr_type as enum
  ('number','integer','enum','multi_enum','boolean','text','range');

-- ATTRIBUTE (reusable definition) ---------------------------------
create table attribute_definitions (
  id            uuid primary key default gen_random_uuid(),
  key           text not null unique,          -- 'voltage_supply', 'connectivity'
  name          text not null,                 -- 'Supply Voltage'
  data_type     attr_type not null,
  unit          text,                           -- display unit 'V','mAh','µF'
  base_unit     text,                           -- SI base for filtering 'V','Ah','F'
  base_factor   numeric,                        -- value_base = value_num * base_factor
  description   text,
  is_filterable boolean not null default true,  -- becomes an Algolia facet
  is_comparable boolean not null default true,  -- shows in compare table
  is_key_spec   boolean not null default false, -- highlighted on cards/PDP header
  display_group text,                           -- 'Power','Connectivity','Processor'
  sort          int not null default 0,
  created_at    timestamptz not null default now()
);

-- ATTRIBUTE OPTIONS (canonical enum members -> no facet fragmentation)
create table attribute_options (
  id            uuid primary key default gen_random_uuid(),
  attribute_id  uuid not null references attribute_definitions(id) on delete cascade,
  value         text not null,                 -- 'WiFi'
  label         text not null,                 -- 'Wi-Fi 802.11 b/g/n'
  sort          int not null default 0,
  unique (attribute_id, value)
);

-- CATEGORY <-> ATTRIBUTE governance (which specs apply where) -----
create table category_attributes (
  category_id   uuid not null references categories(id) on delete cascade,
  attribute_id  uuid not null references attribute_definitions(id) on delete cascade,
  is_required   boolean not null default false,
  sort          int not null default 0,
  primary key (category_id, attribute_id)
);

-- SPECIFICATION (the value a product carries for an attribute) -----
create table product_specifications (
  id             uuid primary key default gen_random_uuid(),
  product_id     uuid not null references products(id) on delete cascade,
  variant_id     uuid references product_variants(id) on delete cascade, -- null = product-level
  attribute_id   uuid not null references attribute_definitions(id) on delete restrict,

  -- one of these value slots is used depending on data_type:
  value_num       numeric,        -- scalar / range low  (display magnitude)
  value_num_high  numeric,        -- range high
  value_base      numeric,        -- normalized to base_unit -> FILTER/SORT on this
  value_base_high numeric,
  unit            text,           -- snapshot of display unit
  value_option_id uuid references attribute_options(id), -- enum / multi_enum member
  value_bool      boolean,
  value_text      text,
  value_display   text not null,  -- precomputed '5 V', '-40 to 85 °C', 'Wi-Fi'

  source         text default 'manual',        -- manual|import|datasheet_parse
  created_at     timestamptz not null default now(),

  -- scalar attrs appear once per product/variant; multi_enum appears once per option.
  -- PG15+ NULLS NOT DISTINCT makes the nulls behave for the uniqueness we want.
  constraint uq_spec unique nulls not distinct
    (product_id, variant_id, attribute_id, value_option_id)
);
