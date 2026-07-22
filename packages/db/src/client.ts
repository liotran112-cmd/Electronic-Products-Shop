import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "./types";

/**
 * Browser / RSC client — uses the ANON key and is governed entirely by RLS.
 * Safe to use with the authenticated user's JWT so `auth.uid()` policies apply.
 * All queries route through Supavisor (transaction pooling); serverless
 * functions must never hold a direct Postgres connection (§6).
 */
export function createAnonClient(): SupabaseClient<Database> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  return createClient<Database>(url, anonKey);
}

/**
 * SERVER-ONLY service-role client — bypasses RLS. Use exclusively in Route
 * Handlers and Inngest functions for sync/mirror writes. Never import into a
 * client component or expose the key to the browser.
 */
export function createServiceClient(): SupabaseClient<Database> {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient<Database>(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
