import {
  createBrowserClient,
  createServerClient,
  type CookieMethodsServer,
} from "@supabase/ssr";

import { clientEnv } from "@repo/env";

import type { Database } from "./types";

/**
 * Supabase Auth (the locked identity decision). These clients carry the user's
 * JWT so Postgres RLS (`auth.uid()`) governs every read. Framework-agnostic:
 * the server factory takes a cookie adapter, which the app wires to
 * `next/headers` (RSC/Route Handlers) or the middleware request/response.
 */
export function createBrowserSupabase() {
  const env = clientEnv();
  return createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function createServerSupabase(cookies: CookieMethodsServer) {
  const env = clientEnv();
  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { cookies },
  );
}

// Named aliases so consumers can annotate return types without a direct
// dependency on @supabase/supabase-js (avoids the pnpm TS2742 portability error).
export type SupabaseBrowserClient = ReturnType<typeof createBrowserSupabase>;
export type SupabaseServerClient = ReturnType<typeof createServerSupabase>;
