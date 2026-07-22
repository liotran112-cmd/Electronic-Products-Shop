-- 0004_content_support.sql — reviews, docs, firmware, devices, tutorials
-- (docs/DATA-MODEL.md §6). Review/manual bodies are canonical elsewhere
-- (reviews app, Sanity, Cloudinary/Storage); these are the queryable mirrors.

create type review_status as enum ('pending','published','rejected','spam');
create table reviews (
  id            uuid primary key default gen_random_uuid(),
  external_id   text unique,                   -- id in reviews app
  product_id    uuid not null references products(id) on delete cascade,
  user_id       uuid,                           -- app user if known (RLS)
  author_name   text,
  rating        int not null check (rating between 1 and 5),
  title         text,
  body          text,
  is_verified   boolean not null default false,
  status        review_status not null default 'pending',
  helpful_count int not null default 0,
  created_at    timestamptz not null default now()
);

create type doc_type as enum ('manual','datasheet','certificate','cad','guide','schematic');
create table documents (
  id           uuid primary key default gen_random_uuid(),
  product_id   uuid not null references products(id) on delete cascade,
  doc_type     doc_type not null,
  title        text not null,
  url          text not null,                 -- Cloudinary (public) / Storage (gated)
  language     text default 'en',
  version      text,
  size_bytes   bigint,
  is_public    boolean not null default true,
  sanity_ref   text,                           -- if body authored in Sanity
  published_at timestamptz,
  created_at   timestamptz not null default now()
);

create type fw_channel as enum ('stable','beta','dev');
create table firmware (
  id                   uuid primary key default gen_random_uuid(),
  product_id           uuid not null references products(id) on delete cascade,
  version              text not null,          -- 'v2.3.1'
  semver               text,                    -- '2.3.1' for sorting
  channel              fw_channel not null default 'stable',
  storage_path         text not null,          -- Supabase Storage (private)
  checksum_sha256      text not null,
  size_bytes           bigint,
  min_hardware_rev     text,
  requires_entitlement boolean not null default false,
  release_notes_ref    text,                    -- Sanity/markdown
  is_public            boolean not null default true,
  published_at         timestamptz,
  created_at           timestamptz not null default now(),
  unique (product_id, version, channel)
);

create table firmware_downloads (             -- audit; append-only, BRIN-friendly
  id          bigint generated always as identity primary key,
  firmware_id uuid not null references firmware(id) on delete cascade,
  user_id     uuid,
  ip          inet,
  at          timestamptz not null default now()
);

-- device registration -> firmware entitlement
create table device_ownership (
  user_id       uuid not null,
  product_id    uuid not null references products(id) on delete cascade,
  serial        text,
  registered_at timestamptz not null default now(),
  primary key (user_id, product_id, serial)
);

-- TUTORIAL (authored in Sanity; this links products <-> content)
create table product_tutorials (
  product_id  uuid not null references products(id) on delete cascade,
  sanity_id   text not null,                   -- Sanity document _id
  title       text not null,
  slug        text not null,
  level       text,                             -- beginner|intermediate|advanced
  sort        int not null default 0,
  primary key (product_id, sanity_id)
);
