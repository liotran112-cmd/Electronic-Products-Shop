import { type NextRequest } from "next/server";

import { updateSession } from "./lib/supabase/middleware";

/**
 * Refreshes the Supabase auth session, then applies security headers
 * (ARCHITECTURE §9). Strict CSP allowlists the services the storefront talks to
 * directly from the browser (Cloudinary, Algolia, PostHog, Shopify, Supabase).
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.posthog.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://res.cloudinary.com https://cdn.shopify.com",
  "font-src 'self' data:",
  "connect-src 'self' https://*.algolia.net https://*.algolianet.com https://*.posthog.com https://*.myshopify.com https://*.supabase.co",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);

  response.headers.set("Content-Security-Policy", CSP);
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload",
  );

  return response;
}

export const config = {
  // Run on all routes except Next internals and static assets.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
