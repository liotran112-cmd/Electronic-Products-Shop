import { z } from "zod";

/**
 * Typed, validated environment (ARCHITECTURE §9, CLAUDE.md "validate inputs").
 *
 * Validation is LAZY — schemas parse on first access, not at import — so a build
 * without secrets never throws, while any runtime code that actually reads env
 * fails fast with a precise message if a var is missing/malformed.
 *
 * `clientEnv()` reads only NEXT_PUBLIC_* (referenced literally so Next can inline
 * them into the browser bundle). `serverEnv()` additionally exposes secrets and
 * must never be called from a Client Component.
 */

const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN: z.string().min(1),
  NEXT_PUBLIC_SANITY_PROJECT_ID: z.string().min(1),
  NEXT_PUBLIC_SANITY_DATASET: z.string().default("production"),
  NEXT_PUBLIC_ALGOLIA_APP_ID: z.string().min(1),
  NEXT_PUBLIC_ALGOLIA_SEARCH_KEY: z.string().min(1),
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().min(1),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().min(1),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().url().default("https://us.i.posthog.com"),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().optional(),
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),
});

// Server SECRETS are all optional at the schema level so that one unset secret
// (e.g. Resend) can never break an unrelated endpoint (e.g. the Shopify
// webhook). Each consumer asserts exactly what IT needs via `requireEnv()` —
// this is the separation-of-concerns boundary for configuration.
const serverSchema = clientSchema.extend({
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SHOPIFY_STORE_DOMAIN: z.string().optional(),
  SHOPIFY_ADMIN_ACCESS_TOKEN: z.string().optional(),
  SHOPIFY_WEBHOOK_SECRET: z.string().optional(),
  SANITY_WEBHOOK_SECRET: z.string().optional(),
  ALGOLIA_ADMIN_KEY: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  INNGEST_EVENT_KEY: z.string().optional(),
  INNGEST_SIGNING_KEY: z.string().optional(),
  REVALIDATE_SECRET: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  TURNSTILE_SECRET_KEY: z.string().optional(),
});

export type ClientEnv = z.infer<typeof clientSchema>;
export type ServerEnv = z.infer<typeof serverSchema>;

// Referenced literally so Next inlines the values into the client bundle.
const clientRuntime = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN: process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN,
  NEXT_PUBLIC_SANITY_PROJECT_ID: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  NEXT_PUBLIC_SANITY_DATASET: process.env.NEXT_PUBLIC_SANITY_DATASET,
  NEXT_PUBLIC_ALGOLIA_APP_ID: process.env.NEXT_PUBLIC_ALGOLIA_APP_ID,
  NEXT_PUBLIC_ALGOLIA_SEARCH_KEY: process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY,
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
  NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
};

let clientCache: ClientEnv | undefined;
let serverCache: ServerEnv | undefined;

function format(error: z.ZodError): never {
  const issues = error.issues.map((i) => `  • ${i.path.join(".")}: ${i.message}`).join("\n");
  throw new Error(`Invalid environment variables:\n${issues}`);
}

export function clientEnv(): ClientEnv {
  if (!clientCache) {
    const parsed = clientSchema.safeParse(clientRuntime);
    if (!parsed.success) format(parsed.error);
    clientCache = parsed.data;
  }
  return clientCache;
}

export function serverEnv(): ServerEnv {
  if (typeof globalThis === "object" && "window" in globalThis) {
    throw new Error("serverEnv() must not be called in the browser — use clientEnv().");
  }
  if (!serverCache) {
    const parsed = serverSchema.safeParse(process.env);
    if (!parsed.success) format(parsed.error);
    serverCache = parsed.data;
  }
  return serverCache;
}

/** Assert a (possibly-optional) env value is present at the point of use. */
export function requireEnv<T>(value: T | undefined | null, name: string): T {
  if (value === undefined || value === null || value === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}
