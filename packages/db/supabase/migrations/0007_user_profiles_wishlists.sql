-- 0007_user_profiles_wishlists.sql — identity bridge + wishlists
-- (ARCHITECTURE §2.2 / §6). Resolves the three-identity problem:
-- app user (Supabase auth.uid) <-> Shopify customer <-> (Sanity author).
-- The Shopify customer id is created lazily via the Admin API on first
-- checkout / account action.

create type user_role as enum ('consumer','b2b','staff');

create table user_profiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  shopify_customer_id text unique,             -- gid://shopify/Customer/... (lazy)
  company             text,
  role                user_role not null default 'consumer',
  b2b_account_id      uuid,                    -- nullable seam; B2B deferred (consumer-first)
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Provision a profile row automatically whenever a new auth user is created.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function handle_new_user();

create table wishlists (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  added_at   timestamptz not null default now(),
  unique (user_id, product_id)
);
