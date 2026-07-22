# Electronics Commerce Platform

World-class electronics ecommerce (10,000+ SKUs): consumer electronics + custom devices. Next.js App Router · TypeScript · Tailwind · shadcn/ui, headless Shopify, Supabase, Sanity, Algolia, Cloudinary, Vercel.

## Architecture docs (source of truth for *what* we build)

Read the relevant doc before implementing a subsystem — do not re-derive decisions already made.

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — system design, service responsibilities, source-of-truth map, security, scaling
- [docs/DATA-MODEL.md](docs/DATA-MODEL.md) — Postgres schema, flexible attribute system, indexing
- [docs/FRONTEND.md](docs/FRONTEND.md) — component architecture, design system, folder structure, perf, a11y, SEO
- [docs/PRODUCT-PAGE.md](docs/PRODUCT-PAGE.md) — PDP data contract, archetypes, structured data
- [docs/SEARCH.md](docs/SEARCH.md) — Algolia index, ranking, sync pipeline
- [docs/CUSTOM-DEVICE-WORKFLOW.md](docs/CUSTOM-DEVICE-WORKFLOW.md) — RFQ / configure-to-order engine
- [docs/BFF-READ-ARCHITECTURE.md](docs/BFF-READ-ARCHITECTURE.md) — read-side domain services, ownership, caching (the only backend interface for UI)
- [docs/DESIGN-SYSTEM.md](docs/DESIGN-SYSTEM.md) — frontend foundation: tokens, primitives, electronics component library, hooks

## Locked decisions (do not relitigate)

- **Source of truth is single per domain.** Shopify = commerce/cart/checkout/orders; Sanity = editorial/docs; Supabase Postgres = specs/taxonomy/firmware/quotes/entitlements. **Algolia and the `products` mirror are derived read models — never hand-authored.**
- **Auth = Supabase Auth** (RLS-native). **Checkout = Shopify hosted.** **B2B = consumer-first**, seams only (`b2b_accounts`/`b2b_role`), no seats/price-lists yet.
- **Approved services beyond the base stack:** Inngest (durable sync), Upstash Redis, Turnstile + Vercel WAF, reviews app, Sentry.

## Workflow — before creating files, explain

1. **What** files you will create
2. **Why** they exist
3. **How** they connect to existing code/docs

Then implement. Keep the explanation proportional to the change.

## Coding standards

### Always
- **TypeScript strict mode** — no `any`, no non-null `!` to dodge types; type end-to-end (Shopify codegen, `sanity typegen`, Supabase generated types).
- **Server Components by default.** Add `"use client"` only for genuine interactivity; keep client islands as small leaves (FRONTEND §3).
- **Server Actions** for mutations (typed, colocated); Route Handlers only for webhooks/auth/secured-key minting.
- **Validate all inputs** with Zod at every Action/Route boundary; never trust the client (config rules, quote transitions validate server-side too).
- **Handle errors properly** — typed results, `error.tsx` boundaries, no swallowed catches; report to Sentry.
- **Loading states** — Suspense + skeletons that match final layout (zero CLS).
- **Empty states** — every list/grid/search/table has a designed `EmptyState`.
- **Accessibility** — WCAG 2.2 AA: semantic HTML, labels, keyboard nav, focus-visible, `aria-live` for async, `prefers-reduced-motion` (FRONTEND §10).
- **Reusable components, no duplicated logic** — primitives in `packages/ui`, domain components in `apps/web/components` grouped by domain; share via `packages/*`.
- **Clean production code** — readable, matches surrounding style, no dead code, no console noise.

### Never
- **Hardcode data** — content from Sanity, commerce from Shopify, specs from Supabase, media from Cloudinary. No magic strings/prices/copy in components; config via env/typed constants.
- **Create unnecessary abstractions** — no premature generalization, no wrapper-around-a-wrapper. Abstract on the 2nd–3rd real use, not the 1st.
- **Rebuild what a service already does** — checkout/payments/tax (Shopify), search/facets (Algolia), image transforms (Cloudinary), email (Resend), durable events (Inngest). Write glue and differentiation only.

## Conventions

- **Monorepo:** Turborepo + pnpm. `apps/web`, `packages/{ui,config,env,core,db,shopify,sanity,search,events,email,media,analytics,kv,domain,cache,bff}` (ARCHITECTURE §11, FRONTEND §4). One package per third-party service; server-only SDKs isolated behind subpath exports (e.g. `@repo/analytics/server`).
- **Read side = BFF (`docs/BFF-READ-ARCHITECTURE.md`).** Frontend consumes ONLY `@repo/bff` (domain services) + `@repo/domain` (types). Importing a source package (`@repo/shopify/db/search/sanity`, `algoliasearch`, `@supabase/*`) from `apps/web` is **blocked by ESLint** (`no-restricted-imports`). Repositories (in `@repo/bff`) are the only code that touches a source; mappers are pure; services compose + cache + handle errors. `@repo/core` = structured logger + HTTP timeout/retry.
- **Env:** never read `process.env` directly in features — import validated `clientEnv()` / `serverEnv()` from `@repo/env`.
- **shadcn/ui:** initialized in `packages/ui` (`components.json`, `new-york`, CSS-variable tokens). Add primitives with `cd packages/ui && npx shadcn@latest add <c>`. Design tokens live in `apps/web/src/app/globals.css`; brand = `--primary` electric blue.
- **Styling:** Tailwind + design tokens (CSS vars) from `packages/ui`; never inline hardcoded colors — use tokens (FRONTEND §2).
- **Data access:** Supabase via anon key + RLS for reads; `service_role` only server-side (Inngest/webhooks). Supavisor transaction pooling.
- **Secrets:** server-only env; only `NEXT_PUBLIC_*` reaches the client (Storefront token, Algolia search key, PostHog key, Cloudinary cloud name).
- **Fetching:** parallel in Server Components (no waterfalls); tag caches for `revalidateTag`; storefront filtering via Algolia, never client→Postgres.
