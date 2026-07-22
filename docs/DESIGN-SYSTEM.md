# Frontend Foundation & Design System

> Phase 3.5 — the reusable UI foundation. No pages yet. Companions: [FRONTEND.md](./FRONTEND.md), [UX-DESIGN.md](./UX-DESIGN.md), [BFF-READ-ARCHITECTURE.md](./BFF-READ-ARCHITECTURE.md).
> Design DNA: **Apple** (storytelling, whitespace, type) · **B&H** (shopping efficiency) · **Digi-Key** (technical depth) · **Adafruit** (education).

---

## 1. Layering & responsibilities

```
packages/ui                design-system PRIMITIVES (shadcn/Radix, framework-agnostic, tokened)
  Button Input Card Badge Skeleton Separator Tabs Accordion Dialog Sheet
  DropdownMenu Tooltip Pagination Spinner EmptyState ErrorState  + cn()

apps/web
  app/
    layout.tsx             root shell: fonts, providers, skip-link, Header/Footer
    providers.tsx          client providers (Cart, MotionConfig, Tooltip)
    globals.css            design TOKENS (CSS variables, light/dark)
  components/
    layout/                app shell: Header, MegaNav, SearchEntry, AccountMenu,
                           CartIndicator, MobileMenu, Footer
    product/               ELECTRONICS library: ProductCard, ProductGrid, PriceDisplay,
                           StockIndicator, SpecificationTable/Group, TechnicalBadge,
                           CompatibilityList, DocumentDownload, RatingSummary, ReviewCard,
                           TutorialCard, RelatedProductCard, ComparisonTable
  hooks/                   client hooks: useCart, useSearch, useCustomer, useMediaQuery
  actions/                 Server Actions bridging client → @repo/bff (search, catalog)
  lib/                     format.ts (price/spec/date), utils
```

**Rules**
- **Primitives** (`packages/ui`) know nothing about the domain — pure props, tokened styles.
- **Electronics components** are **presentational Server Components** that accept `@repo/domain` types (`ProductSummary`, `SpecificationGroup`, …) as props. They never fetch — the page fetches via BFF and passes data down.
- **Client interactivity** is pushed to the smallest leaf (`"use client"`), e.g. add-to-cart button, search box, mobile menu.
- **Data on the client** goes through **Server Actions** that call `@repo/bff` — never a source SDK (ESLint-enforced).

---

## 2. Design tokens

Canonical in `apps/web/src/app/globals.css` (HSL channels, light/dark, `data-theme` override). Consumed via the Tailwind preset (`@repo/config`).

| Token group | Values |
|---|---|
| **Color** | `background/foreground`, `primary` (electric blue `221 83% 53%`), `secondary`, `muted(+fg)`, `accent(+fg)`, `card`, `popover`, `border`, `input`, `ring`; semantic `success/warning/destructive` |
| **Radius** | `--radius: 0.625rem` → `sm/md/lg` derived |
| **Shadow** | `sm` (1px), `md` (6px/22px), `lg` (18px/50px) — low-opacity, layered (Apple) |
| **Typography** | system stack (SF Pro on Apple HW) + `ui-monospace` for specs/prices/SKUs; scale `xs…6xl`; display tracking `-0.02em`, body 1.6 |
| **Spacing** | 8px rhythm (Tailwind default scale) |
| **Motion** | durations `fast 150 / base 250 / slow 400ms`; ease `standard cubic-bezier(.2,0,0,1)`; `prefers-reduced-motion` disables |
| **Breakpoints** | `sm 640 · md 768 · lg 1024 · xl 1280 · 2xl 1536` |

**Motion rules:** entrances ≤250ms; hover lift ≤3px + image scale ≤1.03; overlays fade+scale from 0.98; Framer Motion for orchestration only where it earns its weight (cards, mobile menu, mega-menu) — CSS/`tailwindcss-animate` for the rest. All wrapped by a `MotionConfig reducedMotion="user"`.

---

## 3. Component inventory

### Primitives (`packages/ui`)
`Button` (6 variants × 4 sizes, `asChild`) · `Input` · `Card` (+Header/Title/Content/Footer) · `Badge` (variants) · `Skeleton` · `Separator` · `Spinner` · `Tabs` · `Accordion` · `Dialog` (Modal) · `Sheet` (Drawer) · `DropdownMenu` · `Tooltip` · `Pagination` · `EmptyState` · `ErrorState`. All Radix-backed where interactive → keyboard + ARIA for free.

### Electronics library (`apps/web/components/product`)
| Component | Purpose | Type in |
|---|---|---|
| `PriceDisplay` | mono price + compare-at strike + financing hook | `Money` |
| `StockIndicator` | dot + label (in/low/out/backorder), color+text (not color-only) | `Availability` |
| `TechnicalBadge` | mono spec chip | key/value |
| `RatingSummary` | stars + count | `ReviewSummary` |
| `SpecificationTable` / `SpecificationGroup` | grouped mono spec sheet | `SpecificationGroup[]` |
| `CompatibilityList` | works-with chips | `{label,href}[]` |
| `DocumentDownload` | datasheet/manual row + size + type icon | `DocumentDownload` |
| `ProductCard` / `ProductGrid` | card (media, compare, quick-specs, price, CTA) + responsive grid | `ProductSummary` |
| `RelatedProductCard` | compact card + relationship tag | `RelatedProduct` |
| `TutorialCard` | Adafruit-style learn card | `TutorialPreview` |
| `ReviewCard` | single review | review |
| `ComparisonTable` | sticky-first-col, diff-highlight, horizontal scroll | `ProductDetail[]`/summaries |

### App shell (`apps/web/components/layout`)
`Header` (sticky, search-first) · `MegaNav` (desktop hover/focus panels) · `SearchEntry` (⌘K trigger) · `AccountMenu` (dropdown) · `CartIndicator` (count badge) · `MobileMenu` (Sheet drawer) · `Footer`.

---

## 4. Domain hooks (client) — `@repo/bff` only

| Hook | Kind | Backing |
|---|---|---|
| `useCart()` | client state (Context + reducer, localStorage) | Shopify cart mutations via Server Action (Phase 4) |
| `useSearch()` | debounced live search | `searchAction` → `bff.searchProducts` |
| `useCustomer()` | session/auth snapshot | `bff.getCustomerDashboard`-lite via action |
| `useMediaQuery()` | responsive | matchMedia |

Client hooks never import a source; they call **Server Actions** that call BFF. `useProduct`/`useCategory` data is fetched in RSC pages (server) and passed as props — the hooks exist as client-side prefetch/refresh helpers over the same actions.

---

## 5. Performance & accessibility

- **RSC default**; `"use client"` only for interactivity (cart button, search, menus, motion wrappers).
- **Streaming**: heavy islands (`ProductGrid` rails, recommendations) sit behind `Suspense` with matching `Skeleton` fallbacks (zero CLS).
- **Images**: `next/image`, explicit dimensions, `priority` only on LCP, blur placeholders, Cloudinary domain allowlisted.
- **A11y (WCAG 2.2 AA)**: Radix primitives ship focus-trap/roving-tabindex/ARIA; every interactive has a visible `:focus-visible` ring; status uses icon+text (never color alone); images carry real `alt`; `MotionConfig reducedMotion="user"`; skip-link to `#main`.

---

## 6. Testing

`vitest` + `@testing-library/react` (jsdom) + `user-event`. Categories: **component render**, **interaction** (user-event clicks/keyboard), **accessibility** (role/name/aria assertions), **snapshot** where structure is stable. Route/webhook tests stay on the `node` environment via a per-file directive.
