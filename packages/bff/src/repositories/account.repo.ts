import { cookies } from "next/headers";

import { createServerSupabase, type SupabaseServerClient } from "@repo/db/auth";

/**
 * User-scoped Supabase reads. Uses the request's AUTHENTICATED client so RLS
 * (`auth.uid()`) enforces ownership — never the service role. Quotes, saved
 * products and devices are only ever visible to their owner.
 */

export async function getAuthedClient(): Promise<SupabaseServerClient> {
  const store = await cookies();
  return createServerSupabase({
    getAll: () => store.getAll(),
    setAll: () => {
      // reads only — cookie rotation happens in middleware
    },
  });
}

export async function getCurrentUser(
  db: SupabaseServerClient,
): Promise<{ id: string; email: string } | null> {
  const { data } = await db.auth.getUser();
  return data.user ? { id: data.user.id, email: data.user.email ?? "" } : null;
}

export async function getProfile(db: SupabaseServerClient, userId: string) {
  const { data } = await db
    .from("user_profiles")
    .select("company, role")
    .eq("id", userId)
    .maybeSingle();
  return data;
}

export async function getSavedProductIds(db: SupabaseServerClient, userId: string): Promise<string[]> {
  const { data } = await db.from("wishlists").select("product_id").eq("user_id", userId);
  return (data ?? []).map((r) => r.product_id);
}

export async function getDevices(db: SupabaseServerClient, userId: string) {
  const { data } = await db
    .from("device_ownership")
    .select("product_id, serial, registered_at")
    .eq("user_id", userId);
  return data ?? [];
}

export async function getUserQuotes(db: SupabaseServerClient, userId: string) {
  const { data } = await db
    .from("quote_requests")
    .select("reference, status, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getQuoteByReference(db: SupabaseServerClient, reference: string) {
  const { data: quote } = await db
    .from("quote_requests")
    .select("id, reference, status, created_at, contact_email, company")
    .eq("reference", reference)
    .maybeSingle();
  if (!quote) return null;

  const { data: items } = await db
    .from("quote_items")
    .select("description, quantity, target_price, product_id")
    .eq("quote_id", quote.id);

  return { quote, items: items ?? [] };
}
