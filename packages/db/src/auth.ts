import {
  createBrowserClient,
  createServerClient,
  type CookieMethodsServer,
} from "@supabase/ssr";
import { type SupabaseClient } from "@supabase/supabase-js";

import { clientEnv } from "@repo/env";

import type { Database } from "./types";

// Named aliases so consumers can annotate return types without a direct
// dependency on @supabase/supabase-js (avoids the pnpm TS2742 portability error).
export type SupabaseBrowserClient = SupabaseClient<Database>;
export type SupabaseServerClient = SupabaseClient<Database>;

/**
 * Supabase Auth (the locked identity decision). These clients carry the user's
 * JWT so Postgres RLS (`auth.uid()`) governs every read. Framework-agnostic:
 * the server factory takes a cookie adapter, which the app wires to
 * `next/headers` (RSC/Route Handlers) or the middleware request/response.
 * Return types are annotated so the `Database` schema propagates to callers
 * (createServerClient's inference otherwise widens rows to `never`).
 */
// The @supabase/ssr factories return a client whose extra generic params make
// it structurally incompatible with the plain `SupabaseClient<Database>` alias
// (and whose inferred form widens rows to `never`). Bridge at this one boundary.
export function createBrowserSupabase(): SupabaseBrowserClient {
  const env = clientEnv();
  return createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  ) as unknown as SupabaseBrowserClient;
}

export function createServerSupabase(cookies: CookieMethodsServer): SupabaseServerClient {
  const env = clientEnv();
  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { cookies },
  ) as unknown as SupabaseServerClient;
}
