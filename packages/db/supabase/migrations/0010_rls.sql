-- 0010_rls.sql — Row-Level Security (ARCHITECTURE §6, §9).
-- The DB is the last line of defense, independent of app bugs.
--
-- Roles (Supabase): `anon` (unauthenticated), `authenticated` (has JWT ->
-- auth.uid()), `service_role` (BYPASSES RLS — used only by the sync pipeline /
-- Route Handlers). The sync pipeline writes the catalog mirror as service_role,
-- so no INSERT/UPDATE policies are needed for public catalog tables: absence of
-- a write policy denies anon/authenticated while service_role still writes.

-- ── Public read: catalog & reference ─────────────────────────────
alter table brands                enable row level security;
alter table categories            enable row level security;
alter table product_categories    enable row level security;
alter table product_variants      enable row level security;
alter table attribute_definitions enable row level security;
alter table attribute_options     enable row level security;
alter table category_attributes   enable row level security;
alter table product_specifications enable row level security;
alter table locations             enable row level security;
alter table inventory             enable row level security;
alter table product_tutorials     enable row level security;
alter table product_relations     enable row level security;
alter table compatibility         enable row level security;

create policy public_read on brands                for select using (true);
create policy public_read on categories            for select using (true);
create policy public_read on product_categories    for select using (true);
create policy public_read on product_variants       for select using (is_active);
create policy public_read on attribute_definitions for select using (true);
create policy public_read on attribute_options     for select using (true);
create policy public_read on category_attributes   for select using (true);
create policy public_read on product_specifications for select using (true);
create policy public_read on locations             for select using (true);
create policy public_read on inventory             for select using (true);
create policy public_read on product_tutorials     for select using (true);
create policy public_read on product_relations     for select using (true);
create policy public_read on compatibility         for select using (true);

-- Products: only active/eol are publicly visible; drafts/archived hidden.
alter table products enable row level security;
create policy public_read on products for select
  using (status in ('active', 'eol'));

-- Documents: only public docs; gated docs are served via a Route Handler.
alter table documents enable row level security;
create policy public_read on documents for select using (is_public);

-- Reviews: only published reviews are world-readable; authors see their own.
alter table reviews enable row level security;
create policy public_read on reviews for select
  using (status = 'published' or user_id = (select auth.uid()));

-- ── Sensitive: server-only (RLS enabled, NO policies -> anon/auth denied) ──
-- Supplier cost data must never reach the browser; only service_role reads.
alter table suppliers         enable row level security;
alter table supplier_products enable row level security;

-- ── Firmware: public OR entitled via owned device ────────────────
alter table firmware enable row level security;
create policy fw_read on firmware for select using (
  is_public
  or exists (
    select 1 from device_ownership d
    where d.user_id = (select auth.uid())
      and d.product_id = firmware.product_id
  )
);

alter table firmware_downloads enable row level security;
create policy fw_downloads_own on firmware_downloads for select
  using (user_id = (select auth.uid()));

-- ── User-owned data ──────────────────────────────────────────────
alter table user_profiles enable row level security;
create policy profile_select on user_profiles for select
  using (id = (select auth.uid()));
create policy profile_update on user_profiles for update
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

alter table wishlists enable row level security;
create policy wishlist_owner on wishlists for all
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

alter table device_ownership enable row level security;
create policy device_owner on device_ownership for all
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ── Quotes: owner-scoped; guests (user_id null) captured via Server Action ──
alter table quote_requests enable row level security;
create policy quote_select on quote_requests for select
  using (user_id = (select auth.uid()));
create policy quote_insert on quote_requests for insert
  with check (user_id = (select auth.uid()) or user_id is null);
create policy quote_update on quote_requests for update
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

alter table quote_items enable row level security;
create policy quote_items_owner on quote_items for all
  using (exists (
    select 1 from quote_requests q
    where q.id = quote_items.quote_id and q.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from quote_requests q
    where q.id = quote_items.quote_id and q.user_id = (select auth.uid())
  ));

alter table quote_messages enable row level security;
create policy quote_messages_owner on quote_messages for all
  using (exists (
    select 1 from quote_requests q
    where q.id = quote_messages.quote_id and q.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from quote_requests q
    where q.id = quote_messages.quote_id and q.user_id = (select auth.uid())
  ));
