import { cookies } from "next/headers";

import { createServerSupabase, type SupabaseServerClient } from "@repo/db/auth";

/**
 * Supabase client for Server Components, Server Actions and Route Handlers.
 * Reads/writes the auth cookies so RLS runs as the signed-in user.
 * `cookies()` is async in Next 15, hence the await.
 */
export async function getServerSupabase(): Promise<SupabaseServerClient> {
  const cookieStore = await cookies();
  return createServerSupabase({
    getAll: () => cookieStore.getAll(),
    setAll: (toSet) => {
      try {
        toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
      } catch {
        // Called from a Server Component render, where cookies are read-only.
        // The middleware is responsible for refreshing the session cookie.
      }
    },
  });
}
