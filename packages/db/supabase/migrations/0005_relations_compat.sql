-- 0005_relations_compat.sql — cross-references & compatibility
-- (docs/DATA-MODEL.md §7). Powers compare, recommendations and the
-- "works with ESP32 / Zigbee 3.0" compatibility graph.

create type relation_type as enum
  ('accessory','compatible','alternative','upgrade','replacement','frequently_bought','bundle');

create table product_relations (
  from_product  uuid not null references products(id) on delete cascade,
  to_product    uuid not null references products(id) on delete cascade,
  relation_type relation_type not null,
  weight        numeric not null default 1,     -- ranking hint for recommendations
  note          text,
  primary key (from_product, to_product, relation_type)
);

-- COMPATIBILITY with products OR named platforms/standards
create type compat_kind as enum ('product','platform','standard','protocol','ecosystem');
create table compatibility (
  id                uuid primary key default gen_random_uuid(),
  product_id        uuid not null references products(id) on delete cascade,
  target_kind       compat_kind not null,
  target_product_id uuid references products(id) on delete cascade,
  target_name       text,                        -- when not a catalog product
  notes             text,                        -- 'requires level shifter for 3.3V'
  verified          boolean not null default false,
  constraint compat_target_ck check (
    (target_kind = 'product' and target_product_id is not null) or
    (target_kind <> 'product' and target_name is not null)
  )
);
