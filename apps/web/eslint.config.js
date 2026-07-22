import { nextConfig } from "@repo/config/eslint/next";

export default [
  // Next generates next-env.d.ts (triple-slash refs) and .next/ output.
  { ignores: ["next-env.d.ts", ".next/**"] },
  ...nextConfig,
  {
    // ── The hard BFF boundary (BFF-READ-ARCHITECTURE §1) ──────────────
    // The frontend may import ONLY @repo/bff and @repo/domain. Reaching for a
    // source package (Shopify/Supabase/Algolia/Sanity) fails lint.
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@repo/shopify",
                "@repo/shopify/*",
                "@repo/db",
                "@repo/db/*",
                "@repo/search",
                "@repo/search/*",
                "@repo/sanity",
                "@repo/sanity/*",
                "algoliasearch",
                "algoliasearch/*",
                "@supabase/*",
                "@sanity/*",
              ],
              message:
                "Frontend code must consume @repo/bff domain services, never a source directly. See docs/BFF-READ-ARCHITECTURE.md §1.",
            },
          ],
        },
      ],
    },
  },
  {
    // The app's own Supabase auth wiring + BFF-served API routes are the
    // sanctioned exception (they ARE plumbing, not feature/UI code).
    files: ["src/lib/supabase/**", "src/middleware.ts", "src/app/api/**"],
    rules: { "no-restricted-imports": "off" },
  },
];
