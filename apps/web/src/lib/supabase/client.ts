"use client";

import { createBrowserSupabase, type SupabaseBrowserClient } from "@repo/db/auth";

/** Browser Supabase client (singleton) for Client Components. */
let client: SupabaseBrowserClient | undefined;

export function getBrowserSupabase(): SupabaseBrowserClient {
  if (!client) client = createBrowserSupabase();
  return client;
}
