import { NextResponse, type NextRequest } from "next/server";

import { createServerSupabase } from "@repo/db/auth";

/**
 * Refresh the Supabase auth session on every request and propagate the rotated
 * cookies onto the response (the documented supabase-ssr Next.js pattern).
 * Returns the response the caller should decorate with security headers.
 *
 * Skips gracefully until Supabase env is configured so `next dev` runs on a
 * bare foundation.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return response;

  const supabase = createServerSupabase({
    getAll: () => request.cookies.getAll(),
    setAll: (toSet) => {
      toSet.forEach(({ name, value }) => request.cookies.set(name, value));
      response = NextResponse.next({ request });
      toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
    },
  });

  // Touch the user to trigger token refresh; RLS depends on a valid session.
  await supabase.auth.getUser();

  return response;
}
