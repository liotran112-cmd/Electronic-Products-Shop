# Frontend Architecture

> Next.js App Router · TypeScript · Tailwind · shadcn/ui. Companion to [ARCHITECTURE.md](./ARCHITECTURE.md) and [DATA-MODEL.md](./DATA-MODEL.md).
> Priorities, in order: **Speed → Accessibility → SEO → Premium appearance** (they reinforce, not fight — RSC HTML is fast *and* SEO-friendly *and* a11y-friendly).

---

## 1. Design intent — translating "50% B&H / 30% Apple / 20% Digi-Key"

This is not a mood; it's an allocation of *screen real estate and behavior* per surface.

| Blend | Where it dominates | Concretely |
|---|---|---|
| **50% B&H Photo** — dense, trustworthy commerce | Category, Search, Cart, Brand grids, buy box | Efficient product cards with quick-specs, price/stock/CTA always visible, sticky filter rail, comparison, "add to cart" without leaving the grid |
| **30% Apple** — premium presentation | Homepage, PDP hero, brand hero, custom-device page | Generous whitespace, large restrained type, one accent color, edge-to-edge product imagery, subtle scroll/hover motion, no visual clutter |
| **20% Digi-Key** — technical density | PDP spec sheet, comparison table, faceted filters, documentation | Monospace part numbers/values, parametric tables, deep facets with counts, datasheet/firmware surfaces |

**Rule of thumb:** Apple governs the *chrome and the moments* (hero, transitions, spacing rhythm); B&H governs the *shopping mechanics*; Digi-Key governs the *technical payload*. A PDP literally moves through all three top-to-bottom: Apple hero → B&H buy box → Digi-Key spec sheet.

---

## 2. Design system

shadcn/ui gives us Radix-based, accessible, unstyled-until-tokened primitives. We layer a token system on top (CSS variables → Tailwind theme), so a theme change is a variable change, never a component rewrite.

### 2.1 Tokens (`packages/ui/src/styles/tokens.css`)

```css
:root {
  /* Neutrals — Apple-like paper/ink, high contrast */
  --paper: 0 0% 100%;
  --ink:   240 10% 8%;          /* near-black, not pure #000 */
  --muted-fg: 240 4% 46%;
  --surface: 240 20% 99%;
  --border: 240 6% 90%;

  /* Brand — considered electric blue: B&H trust + tech signal */
  --brand: 221 83% 53%;
  --brand-fg: 0 0% 100%;
  --accent-quiet: 221 83% 96%;  /* tint for chips/hover */

  /* Semantic */
  --success: 142 71% 40%;
  --warning:  38 92% 50%;
  --danger:   0 72% 51%;
  --instock:  142 71% 40%;
  --lowstock: 38 92% 50%;

  /* Radius — slightly rounder than shadcn default (premium, soft) */
  --radius: 0.625rem;

  /* Elevation — low-opacity, layered (Apple) */
  --shadow-sm: 0 1px 2px hsl(240 10% 8% / .05);
  --shadow-md: 0 4px 16px hsl(240 10% 8% / .08);
  --shadow-lg: 0 12px 40px hsl(240 10% 8% / .12);

  /* Motion */
  --ease-standard: cubic-bezier(.2,0,0,1);
  --ease-emphatic: cubic-bezier(.3,0,0,1);
  --dur-fast: 150ms; --dur-base: 250ms; --dur-slow: 400ms;
}

.dark {
  --paper: 240 10% 6%;
  --ink:   0 0% 98%;
  --muted-fg: 240 5% 65%;
  --surface: 240 8% 10%;
  --border: 240 5% 18%;
  --accent-quiet: 221 40% 16%;
}

@media (prefers-reduced-motion: reduce) {
  * { animation-duration: .01ms !important; transition-duration: .01ms !important; }
}
```

### 2.2 Typography

| Role | Font (via `next/font`) | Usage |
|---|---|---|
| UI / body | **Inter** (variable, subset latin) | everything default |
| Display | Inter, tight tracking, 600–700 | hero, section heads (Apple scale) |
| **Mono / technical** | **Geist Mono** (or JetBrains Mono) | part numbers, spec values, prices, SKUs, code (Digi-Key signal) |

Type scale (Tailwind extend): `xs .75 / sm .875 / base 1 / lg 1.125 / xl 1.25 / 2xl 1.5 / 3xl 1.875 / 4xl 2.5 / 5xl 3.5 / 6xl 4.5rem`. Body line-height 1.6; display 1.05–1.15, `-0.02em` tracking. `text-wrap: balance` on headings, `pretty` on lead paragraphs.

### 2.3 Tailwind theme wiring (`tailwind.config.ts` excerpt)

```ts
theme: {
  extend: {
    colors: {
      paper: 'hsl(var(--paper))', ink: 'hsl(var(--ink))',
      brand: { DEFAULT: 'hsl(var(--brand))', fg: 'hsl(var(--brand-fg))' },
      border: 'hsl(var(--border))', muted: { fg: 'hsl(var(--muted-fg))' },
      instock: 'hsl(var(--instock))', lowstock: 'hsl(var(--lowstock))',
    },
    borderRadius: { lg: 'var(--radius)', md: 'calc(var(--radius) - 2px)', sm: 'calc(var(--radius) - 4px)' },
    boxShadow: { sm: 'var(--shadow-sm)', md: 'var(--shadow-md)', lg: 'var(--shadow-lg)' },
    fontFamily: { sans: ['var(--font-inter)'], mono: ['var(--font-geist-mono)'] },
    transitionTimingFunction: { standard: 'var(--ease-standard)', emphatic: 'var(--ease-emphatic)' },
  }
}
```

### 2.4 Design principles enforced in review
- **One accent.** Brand blue is the only saturated color; everything else neutral. Semantic colors used only for status.
- **Contrast AA minimum** (4.5:1 text, 3:1 UI) — verified in both themes.
- **8px spacing rhythm**; whitespace is a feature, not empty space.
- **Motion is subtle and purposeful** — entrances ≤250ms, respects `prefers-reduced-motion`.

---

## 3. Rendering model (the core architectural decision)

**Server Components by default. Client components are islands, added only for interactivity.** We adopt **Partial Prerendering (PPR)**: a static, cached shell streams instantly; dynamic bits (live price/stock, personalized rails) stream in via Suspense — best of static + dynamic on one page.

```
┌─ Static shell (prerendered, CDN, tagged) ──────────────────────┐
│  header · hero/gallery · title · spec sheet · docs · footer     │
│  ┌─ Suspense boundary ─ dynamic, streamed ──────────────────┐  │
│  │  <BuyBox/>  live price + stock (Shopify)   [client island]│  │
│  │  <Recommendations/>  personalized (Algolia/PostHog)       │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

**Client-island inventory (everything else is a Server Component):**

| Island | Why client | Loading |
|---|---|---|
| `BuyBox` (variant select, qty, add-to-cart) | Shopify cart mutation, live stock | in-view, priority |
| `SearchExperience` (Algolia InstantSearch) | typeahead, facets, sort | route-level, on `/search` |
| `FilterRail` / `FacetBottomSheet` | interactive refine | with listing |
| `ComparisonDrawer` / compare table | client selection state | `dynamic()` lazy |
| `ImageGallery` (zoom/swipe) | pointer/touch interaction | `dynamic()`, hydrate on interaction |
| `MegaMenu` | keyboard/hover nav | header (small) |
| `CartSheet` | global cart state | provider |
| `QuoteForm`, account forms | inputs + Server Actions | on route |
| `AnalyticsProvider` (PostHog) | client SDK | deferred/idle |

**Mutations = Server Actions** (typed, CSRF-safe, colocated): add-to-cart proxy, submit quote, wishlist toggle, register device, review submit.

---

## 4. Folder structure (monorepo — Turborepo + pnpm)

```
apps/web/
  app/
    (marketing)/                 # route group: shared premium chrome
      page.tsx                   # Homepage
      brands/[slug]/page.tsx     # Brand page
      learn/                     # Blog / tutorials (Sanity)
        page.tsx
        [slug]/page.tsx
      docs/[...slug]/page.tsx    # Documentation
    (shop)/                      # route group: commerce chrome
      c/[...category]/page.tsx   # Category (catch-all depth)
      search/page.tsx            # Search results
      products/[handle]/         # PDP
        page.tsx
        opengraph-image.tsx      # dynamic OG (next/og)
      compare/page.tsx           # Comparison
      quote/page.tsx             # Custom device request
    (account)/                   # route group: auth-gated, no cache
      account/
        layout.tsx               # auth guard (middleware + server check)
        page.tsx                 # dashboard
        orders/page.tsx
        devices/page.tsx         # registrations + firmware
        quotes/page.tsx
    api/
      webhooks/{shopify,sanity}/route.ts
      firmware/[id]/download/route.ts
      search/keys/route.ts       # mint Algolia secured keys
      inngest/route.ts
    layout.tsx                   # root: fonts, providers, skip-link
    sitemap.ts  robots.ts  manifest.ts  error.tsx  not-found.tsx
  components/
    commerce/                    # BuyBox, ProductCard, PriceTag, StockBadge, CartSheet
    search/                      # SearchExperience, FilterRail, FacetBottomSheet, Hits, SortMenu
    product/                     # Gallery, SpecSheet, VariantSelector, CompatibilityList, FirmwareList, DocList
    compare/                     # CompareTable, CompareDrawer
    layout/                      # Header, MegaMenu, Footer, Breadcrumbs, Container
    content/                     # PortableText (Sanity), TutorialCard, Callout, TOC
    marketing/                   # Hero, FeatureBand, LogoWall, StatStrip
    quote/                       # QuoteForm, QuoteItemRow, FileDrop
    account/                     # OrderList, DeviceCard, QuoteThread
  lib/
    shopify/  sanity/  supabase/ algolia/  cloudinary/  analytics/
    seo/      # metadata builders, JSON-LD helpers
    utils/    # cn(), formatters (price/spec/unit)
  hooks/      # useCart, useCompare, useMediaQuery, useDebounce
  styles/     globals.css
packages/
  ui/         # shadcn primitives + tokens (design system, framework-agnostic)
    src/components/ui/  src/styles/tokens.css
  shopify/ sanity/ db/ search/ config/   # shared clients & types (see ARCHITECTURE §11)
```

**Convention:** shadcn primitives live in `packages/ui` (shared, versioned design system). App-specific compositions live in `apps/web/components`, grouped **by domain, not by type**.

---

## 5. Component architecture (layers)

```
Primitives (packages/ui, shadcn/Radix)
  Button Input Select Dialog Sheet Tabs Accordion Tooltip Popover
  Badge Card Skeleton Table Checkbox RadioGroup Slider Toast Command
        │  (accessible, tokened, no business logic)
        ▼
Composite domain components (apps/web/components)
  ProductCard  BuyBox  SpecSheet  FilterRail  CompareTable  QuoteForm ...
        │  (compose primitives + data shapes; RSC unless interactive)
        ▼
Sections (page bands)
  Hero  ProductGrid  FacetedResults  RelatedRail  DocumentationBody ...
        ▼
Pages (app/**/page.tsx — Server Components: fetch, compose, set metadata)
```

Data flows **down as props from Server Components**; interactivity is pushed to the smallest possible leaf island. `ProductCard` is a Server Component; only its "add to cart" button is a client leaf.

---

## 6. UI component inventory

**Primitives (shadcn/ui):** Button, IconButton, Input, Textarea, Select, Combobox/Command, Checkbox, RadioGroup, Switch, Slider, Dialog, Sheet, Drawer, Popover, Tooltip, DropdownMenu, Tabs, Accordion, Badge, Avatar, Card, Table, Pagination, Breadcrumb, Skeleton, Toast/Sonner, Progress, Separator, ScrollArea, AspectRatio.

**Commerce:** `ProductCard`, `ProductCardCompact`, `PriceTag` (mono, sale/compare-at), `StockBadge` (in/low/backorder/lead-time), `BuyBox`, `VariantSelector`, `QuantityStepper`, `AddToCartButton`, `WishlistButton`, `CartSheet`, `MiniCartLine`, `TrustBar` (shipping/returns/warranty — B&H trust cues).

**Search & browse:** `SearchExperience`, `SearchBox` (typeahead w/ product + category + content suggestions), `FilterRail`, `FacetGroup` (checkbox/range/hierarchical), `RangeFacet` (dual slider, unit-aware), `FacetBottomSheet` (mobile), `SortMenu`, `Hits`, `ResultCount`, `ActiveFilters` (removable chips), `NoResults`.

**Product (Digi-Key surfaces):** `ImageGallery` (zoom, thumbnails, swipe), `SpecSheet` (grouped by `display_group`, mono values), `KeySpecStrip` (`is_key_spec` chips), `CompatibilityList`, `FirmwareTable` (version, channel, checksum, gated download), `DocumentList` (manuals/datasheets/CAD), `TutorialRail`, `QAndA`, `ReviewSummary` + `ReviewList` (mirror).

**Compare:** `CompareTable` (sticky first column, horizontal scroll, diff-highlight rows), `CompareDrawer` (persistent selection), `AddToCompareButton`.

**Marketing (Apple surfaces):** `Hero` (image/video, restrained), `FeatureBand`, `ProductSpotlight`, `CategoryTiles`, `BrandHero`, `LogoWall`, `StatStrip`, `Newsletter`.

**Content:** `PortableText` renderer (Sanity → typed), `TableOfContents`, `Callout`, `CodeBlock`, `StepList`, `TutorialCard`, `DocSidebar`, `ArticleMeta`.

**Quote & account:** `QuoteForm` (multi-step: requirements → specs → contact), `QuoteItemRow`, `SpecRequestField`, `FileDrop`, `OrderList`, `OrderCard`, `DeviceCard`, `QuoteThread`, `AddressBook`.

**Layout & feedback:** `Header`, `MegaMenu`, `Footer`, `Breadcrumbs`, `Container`, `SectionHeader`, `SkipLink`, `EmptyState`, `ErrorState`, error boundaries, loading skeletons per route.

---

## 7. Page compositions

Each page: layout blend, LCP element, RSC/island split, data sources.

| Page | Composition (top→bottom) | LCP | Islands | Data |
|---|---|---|---|---|
| **Homepage** | Hero (Apple) → CategoryTiles → ProductSpotlight rails → StatStrip → Newsletter | Hero image | Newsletter, rail carousels | Sanity (layout), Algolia (rails) — ISR |
| **Category** | Breadcrumbs → SectionHeader → FilterRail ∥ ProductGrid → Pagination | first card image | FilterRail, grid add-to-cart | Algolia SSR first paint + client refine |
| **Search** | SearchBox → ActiveFilters → FacetRail ∥ Hits → Sort | first hit | full SearchExperience | Algolia (secured key) |
| **PDP** | Gallery ∥ BuyBox → KeySpecStrip → Tabs{Specs, Compatibility, Docs, Firmware, Reviews, Tutorials} → RelatedRail | hero gallery image | BuyBox, Gallery, Recommendations | Shopify + Supabase + Sanity (PPR) |
| **Brand** | BrandHero → featured → filtered ProductGrid | brand hero | grid, filter | Supabase/Sanity + Algolia |
| **Compare** | sticky CompareTable, diff-highlighted | table | CompareTable | Supabase specs / Algolia |
| **Documentation** | DocSidebar ∥ ArticleBody + TOC | first heading | TOC scrollspy | Sanity |
| **Blog/Tutorial** | ArticleMeta → PortableText → related | cover image | — (static) | Sanity — SSG/ISR |
| **Account** | nav ∥ dashboard cards (orders, devices, quotes) | — | all client, auth-gated | Supabase (RLS), Shopify orders |
| **Custom device request** | Apple hero → multi-step QuoteForm → reassurance | hero | QuoteForm | Server Action → Supabase |

---

## 8. Responsive strategy

**Mobile-first.** Breakpoints: `sm 640 · md 768 · lg 1024 · xl 1280 · 2xl 1536`. **Container queries** for cards/rails so a `ProductCard` reflows by *its* width, not the viewport (reusable in grid, rail, and compare contexts).

| Pattern | Desktop | Mobile |
|---|---|---|
| Filters | sticky left rail | `FacetBottomSheet` (Sheet) + sticky "Filter (3)" bar |
| Buy box | sticky right column | sticky bottom action bar (price + Add to cart) |
| Mega menu | hover/focus panel | full-height Drawer, accordion sections |
| Compare table | full table | horizontal scroll, sticky first column, key-specs first |
| Product grid | 3–4 col | 2 col cards / 1 col rows toggle |
| Gallery | thumbnails + zoom | swipe carousel + pinch |
| PDP tabs | tabbed | stacked Accordion |

Touch targets ≥44px; safe-area insets honored; no horizontal overflow — wide tech tables scroll inside their own container.

---

## 9. Performance strategy

Targets (mobile p75, real-user): **LCP < 2.0s · INP < 200ms · CLS < 0.05 · TTFB < 0.5s**. Enforced with a Lighthouse-CI budget in the pipeline + PostHog web-vitals RUM.

| Lever | Implementation |
|---|---|
| **Rendering** | RSC default + **PPR**: static shell from CDN, dynamic price/stock/recs streamed via Suspense. Minimal client JS. |
| **Caching** | ISR + `revalidateTag` (per-product/collection/content). Route segment config; `fetch` cache tags. |
| **Images** | Cloudinary + `next/image`, `f_auto,q_auto`, responsive `sizes`, AVIF/WebP, explicit dimensions (zero CLS), `priority` only on LCP, `loading=lazy` + blur placeholder elsewhere. |
| **Fonts** | `next/font` self-hosted, subset latin, `display: swap`, preloaded; 2 families max, variable weights → no layout shift, no FOUT flash. |
| **JS budget** | Islands only; heavy widgets (`ImageGallery`, `CompareTable`, InstantSearch) via `dynamic()`, some hydrate-on-interaction. Tree-shake icon imports. Target < 100KB JS on content routes. |
| **Third parties** | PostHog loaded on idle/`afterInteractive`; Algolia client lazy on search routes; no render-blocking scripts. |
| **Prefetch** | `<Link>` viewport prefetch for likely next routes (category→PDP); `router.prefetch` on card hover. |
| **Data** | Parallel fetches in Server Components (no waterfalls); `React.cache`/dedupe; Algolia for filtering (never round-trip Postgres from the client). |
| **Edge** | Middleware (auth, headers, geo) at edge; static assets on Vercel CDN. |

**Anti-CLS discipline:** every image/media/embed has reserved dimensions; skeletons match final layout box; no injecting content above the fold after paint.

---

## 10. Accessibility (WCAG 2.2 AA)

- **Primitives are accessible by default** (Radix/shadcn): focus trapping in dialogs/sheets, roving tabindex in menus/tabs, `aria-*` wired.
- **Semantic structure:** one `<h1>`/page, logical heading order, landmarks (`header/nav/main/aside/footer`), `SkipLink` to `#main`.
- **Keyboard:** every interaction reachable and operable; visible focus rings (`:focus-visible`, 2px brand ring); mega-menu, facets, compare, gallery fully keyboard-navigable; Esc closes overlays.
- **Facets/search:** checkboxes are real inputs with labels + result counts; `aria-live="polite"` announces result-count changes; loading states announced.
- **Forms (quote/account):** explicit `<label>`, `aria-describedby` for hints/errors, `aria-invalid`, error summary focus on submit, no color-only error signaling.
- **Cart/toasts:** `aria-live` regions announce add-to-cart / stock changes.
- **Media:** meaningful `alt` on product images (title + variant), decorative images `alt=""`, captions on video, no autoplay with sound.
- **Motion/contrast:** `prefers-reduced-motion` respected globally; AA contrast verified in light and dark; never convey meaning by color alone (icons + text on stock/status).
- **Testing:** `eslint-plugin-jsx-a11y`, axe in Playwright e2e, keyboard-only pass per page in review.

---

## 11. SEO

- **Server-rendered HTML** for all indexable routes (RSC/PPR) — crawlers get full content, no JS execution needed.
- **Metadata:** `generateMetadata` per route (title templates, description, canonical, OG/Twitter). Dynamic **OG images** via `opengraph-image.tsx` (`next/og`).
- **Structured data (JSON-LD):** `Product` (+ `Offer`, `AggregateRating`, `Brand`), `BreadcrumbList`, `ItemList` (category/search), `TechArticle`/`HowTo` (tutorials), `FAQPage` (PDP Q&A), `Organization`/`WebSite` (+ Sitelinks search box).
- **Sitemaps:** dynamic `sitemap.ts` — products from the Supabase mirror, content from Sanity, split into index + child sitemaps at scale; `lastmod` from `updated_at`.
- **URLs:** clean, human, stable — `/products/[handle]`, `/c/dev-boards/mcu-boards`, `/brands/[slug]`, `/learn/[slug]`. Canonical tags to defeat facet-parameter duplication; `rel=prev/next` semantics via canonical + noindex on deep filter permutations.
- **Robots/crawl budget:** `robots.ts`, noindex thin/duplicate facet combos, index the curated category + key parametric landing pages.
- **Vitals as ranking input:** the §9 budgets double as SEO (Core Web Vitals).
- **i18n-ready:** locale-aware routing + `hreflang` reserved in the metadata layer for later expansion.
```
