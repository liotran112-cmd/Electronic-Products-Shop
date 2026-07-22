-- 0006_quotes.sql — custom-device quote requests (docs/DATA-MODEL.md §8).
-- user_id is nullable (guest quotes); RLS scopes owner access (see 0010).

create type quote_status as enum ('new','reviewing','quoted','won','lost','cancelled');
create table quote_requests (
  id            uuid primary key default gen_random_uuid(),
  reference     text not null unique,          -- 'Q-2026-000482'
  user_id       uuid,                           -- nullable = guest; RLS scopes owner
  company       text,
  contact_name  text,
  contact_email text not null,
  phone         text,
  status        quote_status not null default 'new',
  target_date   date,
  budget_range  text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table quote_items (
  id           uuid primary key default gen_random_uuid(),
  quote_id     uuid not null references quote_requests(id) on delete cascade,
  product_id   uuid references products(id),   -- reference a catalog item, or null for bespoke
  description  text not null,
  quantity     int not null default 1,
  target_price numeric(12,2),
  specs        jsonb not null default '{}',    -- freeform requested specs
  attachments  jsonb not null default '[]'     -- [{name,url}] Cloudinary/Storage
);

create table quote_messages (
  id        uuid primary key default gen_random_uuid(),
  quote_id  uuid not null references quote_requests(id) on delete cascade,
  author_id uuid,
  is_staff  boolean not null default false,
  body      text not null,
  at        timestamptz not null default now()
);
