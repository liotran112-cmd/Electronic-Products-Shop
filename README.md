# Electronics Commerce Platform

Headless commerce for consumer electronics + custom devices. Turborepo + pnpm
monorepo. Architecture: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) ·
data model: [docs/DATA-MODEL.md](docs/DATA-MODEL.md).

## Layout

```
apps/web            Next.js 15 App Router storefront (RSC + client islands)
packages/config     shared eslint / tsconfig / tailwind preset
packages/ui         Tailwind component library (@repo/ui)
packages/db         Supabase client, types, migrations + RLS (@repo/db)
packages/shopify    Storefront + Admin GraphQL clients (@repo/shopify)
packages/sanity     GROQ client (@repo/sanity)
packages/search     Algolia index + record-merge (@repo/search)
packages/events     Inngest client + sync functions (@repo/events)
```

## Getting started

```bash
pnpm install
cp apps/web/.env.example apps/web/.env.local   # fill in service keys

# local database (requires Docker + Supabase CLI)
pnpm --filter @repo/db db:start
pnpm --filter @repo/db db:reset                # applies migrations + seed
pnpm --filter @repo/db gen:types               # regenerate typed schema

pnpm dev          # run the app
pnpm typecheck    # typecheck all packages
pnpm lint
pnpm build
```

## Source-of-truth rule

A field is authored in exactly one system. `products` (Supabase) and the Algolia
index are **derived read models** — written only by the sync pipeline, never by
hand. See ARCHITECTURE §2.1.
