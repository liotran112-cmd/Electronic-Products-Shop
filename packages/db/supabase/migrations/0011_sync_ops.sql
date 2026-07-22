-- 0011_sync_ops.sql — operational tooling for the sync pipeline (audit §7).
-- sync_events = run history + dead-letter; category_trail = single-query
-- ancestor lookup that replaces the N+1 parent walk (audit §6).

-- Run history / dead-letter for every reindex/deindex attempt -----
create table sync_events (
  id             bigint generated always as identity primary key,
  correlation_id text,
  entity         text not null default 'product',   -- future: 'collection', ...
  entity_ref     text,                                -- shopify GID / handle
  event          text not null,                       -- 'reindex' | 'deindex'
  status         text not null,                       -- indexed|deindexed|skipped|failed
  attempts       int  not null default 1,
  duration_ms    int,
  error          text,
  created_at     timestamptz not null default now()
);

create index idx_sync_events_status on sync_events (status, created_at desc);
create index idx_sync_events_ref    on sync_events (entity_ref, created_at desc);
create index idx_sync_events_time   on sync_events using brin (created_at);

-- Service-role only: written by the pipeline, read by ops tooling. Enabling RLS
-- with no policy denies anon/authenticated; service_role bypasses RLS.
alter table sync_events enable row level security;

-- Ancestor display-names root→leaf in ONE query, via ltree containment.
-- Replaces the per-product parent-walk (N+1) in loadProductForIndex.
create or replace function category_trail(p_category uuid)
returns text[]
language sql
stable
as $$
  select array_agg(c.name order by nlevel(c.path))
  from categories c
  where c.path @> (select path from categories where id = p_category);
$$;
