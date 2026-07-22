# UX & Design System

> The design layer over the architecture. Reconciles with — does not duplicate — [FRONTEND.md](./FRONTEND.md) (tokens, components, perf, a11y), [PRODUCT-PAGE.md](./PRODUCT-PAGE.md) (PDP), [CUSTOM-DEVICE-WORKFLOW.md](./CUSTOM-DEVICE-WORKFLOW.md) (configurator).
> Philosophy: **"The Apple experience for discovering electronics, with Digi-Key technical depth, and B&H shopping convenience."**

---

## 1. UX strategy

Six references, one product. The strategy is not to average them — it's to sequence them so each audience meets the right one at the right moment.

| Principle | What it means | Reference resolved |
|---|---|---|
| **Progressive technical depth** | Lead with clarity and beauty; reveal specs, datasheets, and parametrics on demand. A shopper and an engineer share one page because depth is *layered*, not front-loaded. | Apple surface → Digi-Key depth |
| **Two co-equal discovery modes** | *Browse-beautiful* (visual, editorial, category-led) and *search-first* (command-K, parametric). Neither is subordinate. | B&H browse + Digi-Key/Mouser search |
| **Trust through transparency** | Real stock counts, real lead times, datasheets one click away, honest pricing. Nothing hidden behind "contact us" that shouldn't be. | Digi-Key/Mouser rigor |
| **Approachable technical** | Humanize specs — plain-language key specs, iconography, "what this means" — so a table is a *last* resort, never the first thing you see. | avoids industrial-ecommerce density |
| **One shell, two audiences** | B2C and B2B share the premium chrome; B2B affordances (quote, bulk price breaks, net terms) appear *contextually*, never cluttering the consumer path. | — |
| **Performance is UX** | Speed, mobile-first, a11y and SEO are design constraints, not afterthoughts (priorities from FRONTEND.md). | 2026 baseline |

**Visual direction:** premium, clean, modern, trustworthy, technical-but-approachable. **Explicitly avoided:** dense tables everywhere, enterprise blue/gray chrome, complicated navigation, dated industrial styling. The signature device that reconciles "premium + technical" is a **precision motif** — hairline rules, monospace labels with tabular numerals, compact spec chips — set against generous whitespace and large product imagery. Engineering rigor you can *feel* without a wall of tables.

---

## 2. Information architecture

### Global taxonomy (mega-menu spine)
Primary categories: **Smartphones · Smart Home · Wearables · IoT Devices · Custom Electronics · Accessories**.
Secondary top-level: **Learn** (tutorials/guides — Adafruit/iFixit), **Brands**, **Support & Downloads**, **Solutions / B2B**.

### Sitemap
```
/                         Homepage
/c/[...category]          Category / listing (faceted)      ← Smartphones, Smart Home, …
/search                   Search results (command-K target)
/products/[handle]        PDP (archetype-adaptive)
/brands · /brands/[slug]  Brand showcase / brand page
/compare                  Comparison
/learn · /learn/[slug]    Education (tutorials, projects)
/docs/[...slug]           Knowledge base / support
/custom                   Custom solutions landing (B2B)
/quote/configure/[family] Configurator wizard
/quote/[reference]        Quote portal
/account/*                Dashboard: orders · saved · quotes · downloads · warranty
```
URL rules, canonical/hreflang, sitemap generation: see FRONTEND §11 (unchanged).

### Navigation model — search-first
- **Persistent search** in the header (⌘K / click) with federated Autocomplete (products · categories · brands · Learn) — SEARCH §6.
- **Mega menu**: visual category columns (not text lists), a featured/new-tech slot, and **Recently viewed** (localStorage/PostHog). Opens on hover+focus (desktop), full-height drawer with accordions (mobile).
- **Breadcrumbs** everywhere below top level (ltree taxonomy).

---

## 3. Wireframes

### 3.1 Homepage
```
┌ Header ─ [wordmark]  ⌘K Search…            Learn  Brands  Solutions  ♥  ⇄  🛒  ▾ ┐
├──────────────────────────────────────────────────────────────────────────────────┤
│ HERO (Apple)                                                                       │
│   ┌───────────────────────────────┐   Featured / New technology                   │
│   │  large product imagery         │   Headline (display)                          │
│   │  (edge-to-edge, soft shadow)   │   one-line value prop                         │
│   │                                │   ── spec chips: 5V · ESP32 · Wi-Fi+BT ──     │
│   └───────────────────────────────┘   [ Shop ]  [ Explore custom ]                 │
├──────────────────────────────────────────────────────────────────────────────────┤
│ FEATURED CATEGORIES — 6 visual tiles                                               │
│  [Smartphones][Smart Home][Wearables][IoT Devices][Custom][Accessories]            │
├──────────────────────────────────────────────────────────────────────────────────┤
│ TRENDING PRODUCTS — horizontal rail of ProductCards (quick specs + price + ⇄)      │
├──────────────────────────────────────────────────────────────────────────────────┤
│ NEW ARRIVALS — grid, "new" tags                                                    │
├──────────────────────────────────────────────────────────────────────────────────┤
│ CUSTOM SOLUTIONS (B2B band) — capabilities + "Request a quote" CTA (premium)       │
├──────────────────────────────────────────────────────────────────────────────────┤
│ EDUCATIONAL CONTENT — TutorialCards (Learn/projects) — Adafruit/iFixit feel        │
├──────────────────────────────────────────────────────────────────────────────────┤
│ BRAND SHOWCASE — logo wall / featured manufacturers                                │
├──────────────────────────────────────────────────────────────────────────────────┤
│ Newsletter · Footer                                                                │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Mega menu (search-first, visual)
```
┌ Smartphones ▾ ─────────────────────────────────────────────────────────────┐
│  BROWSE                 POPULAR                     FEATURED                 │
│  Flagship               [img] Model A   $—          ┌─────────────────────┐ │
│  Mid-range              [img] Model B   $—          │  New technology     │ │
│  Rugged / Industrial    [img] Model C   $—          │  featured spotlight │ │
│  By connectivity ›                                  └─────────────────────┘ │
│  ─────────────────────────────────────────────────────────────────────────  │
│  RECENTLY VIEWED   [img][img][img][img]                    See all in Learn →│
└──────────────────────────────────────────────────────────────────────────────┘
```

### 3.3 Product Listing Page (thousands of products)
```
┌ Breadcrumbs ─ Smart Home › Sensors                         12,438 results ▾sort ┐
├───────────────┬─────────────────────────────────────────────────────────────────┤
│ FILTER RAIL   │  ActiveFilters: [Wi-Fi ✕][USB-C ✕]           [Compare (2) ▸]      │
│ (adaptive,    │  ┌ ProductCard ─────────┐ ┌ ProductCard ─────┐ ┌ ProductCard ─┐  │
│  DynamicWid.) │  │ [img]           ⇄ ☐  │ │ [img]        ⇄ ☐ │ │ [img]     ⇄☐ │  │
│               │  │ Brand · Title        │ │ …                │ │ …            │  │
│ Connectivity  │  │ ● In stock (1,204)   │ │                  │ │              │  │
│  ☑ Wi-Fi      │  │ 5V · Wi-Fi+BT · IP65 │ │ quick specs      │ │ quick specs  │  │
│  ☑ Bluetooth  │  │ $12.90     [ Add ]   │ │ $—     [ Add ]   │ │ $—   [ Add ] │  │
│  ☐ LTE        │  └──────────────────────┘ └──────────────────┘ └──────────────┘  │
│ Power         │  … grid continues (3–4 col desktop / 2 col mobile) …              │
│  ☐ Battery    │                                                                   │
│  ☑ USB-C      │  [ ‹ 1 2 3 … › ]                                                  │
│  ☐ 12V        │                                                                   │
│ Performance   │                                                                   │
│  CPU ▸ RAM ▸  │  (mobile: rail → "Filter (3)" sticky bar → bottom sheet)          │
│  Storage ▸    │                                                                   │
└───────────────┴─────────────────────────────────────────────────────────────────┘
```

### 3.4 Account dashboard
```
┌ Account ─────────────────────────────────────────────────────────────────────┐
│  nav: Overview · Orders · Saved · Quotes · Downloads · Warranty · Settings     │
├───────────────────────────────────────────────────────────────────────────────┤
│  Overview cards:  [Open orders 2] [Active quotes 1] [Registered devices 4]     │
│  ORDERS      list: # · date · status pill · total · [Track] [Invoice]          │
│  SAVED       ProductCard grid (wishlist)                                        │
│  QUOTES      Q-ref · template · status · [Open portal]                          │
│  DOWNLOADS   firmware/manuals for registered devices (gated) + checksum         │
│  WARRANTY    device · serial · expiry · [Register] [Claim]                      │
└───────────────────────────────────────────────────────────────────────────────┘
```

### 3.5 PDP & Custom device
PDP layout (hero → price → purchase → key benefits → specs → docs → downloads → compatibility → tutorials → reviews → related) is fully specified in **[PRODUCT-PAGE.md](./PRODUCT-PAGE.md)** (§2 layout, §3 components). Custom device (configuration → hardware options → quote → consultation → file upload → manufacturing timeline) in **[CUSTOM-DEVICE-WORKFLOW.md](./CUSTOM-DEVICE-WORKFLOW.md)** (§3 wizard). Not restated here.

---

## 4. Component hierarchy

Extends FRONTEND §5–6; new/notable for these pages:

```
Layout      Header · SearchTrigger(⌘K) · MegaMenu · RecentlyViewed · Footer · Breadcrumbs
Home        Hero · CategoryTile(×6) · ProductRail · NewArrivalsGrid · CustomSolutionsBand
            · TutorialCard · BrandWall · Newsletter
Discovery   SearchExperience · FilterRail / FacetBottomSheet · FacetGroup{checkbox,range,hier}
            · ActiveFilters · SortMenu · ProductCard · CompareBar
ProductCard  [ Media · CompareCheckbox · Badge ] → [ Brand · Title · StockBadge
             · KeySpecChips · PriceTag · AddToCart ]      ← the reused atom
Account     DashboardNav · SummaryCard · OrderRow · SavedGrid · QuoteRow
            · DownloadRow · WarrantyCard
Primitives  (packages/ui — shadcn): Button · Card · Badge · Checkbox · Slider · Sheet
            · Tabs · Accordion · Table · Input · Command · Skeleton · Toast · EmptyState
```
`ProductCard` is the load-bearing reusable atom (rail, grid, saved, compare all share it). Server Component; only its `AddToCart` + `CompareCheckbox` are client leaves.

---

## 5. Design tokens & system

Canonical tokens live in `packages/ui` (FRONTEND §2.1). This section is the **visual spec** for the components the brief names (buttons, cards, tables, filters, forms, responsive).

### 5.1 Color
Single accent discipline — brand blue is the only saturated hue; neutrals carry a slight cool bias (chosen, not defaulted). Semantic colors are separate from the accent.
```
ink      hsl(240 10% 8%)     paper    hsl(0 0% 100%)     surface  hsl(240 20% 99%)
muted-fg hsl(240 4% 46%)     border   hsl(240 6% 90%)
brand    hsl(221 83% 53%)    brand-fg white             accent-quiet hsl(221 83% 96%)
in-stock hsl(142 71% 40%)    low      hsl(38 92% 50%)    danger  hsl(0 72% 51%)
Dark: paper→8% ink→98%, surfaces/borders lift, accent tuned for contrast (both themes designed).
```

### 5.2 Typography
System-native stack (renders as SF Pro on Apple hardware — reinforces the Apple reference — Segoe/Roboto elsewhere), monospace for technical data. Strong scale, tight display tracking.
```
display  clamp(2rem→4.5rem)  weight 600  tracking -0.02em  line 1.05
h1–h3    2.5 / 1.875 / 1.5rem  600         balance
body     1rem  line 1.6                     lead: text-wrap pretty
label    0.75rem  600  uppercase  tracking 0.06em
mono     ui-monospace — SKUs, spec values, prices, part numbers  (tabular-nums)
```

### 5.3 Buttons
| Variant | Use | Style |
|---|---|---|
| **Primary** | main CTA (Add to cart, Request quote) | brand fill, white text, radius `md`, subtle shadow, `active` press |
| **Secondary** | alt action | ink outline / surface fill |
| **Ghost** | tertiary, toolbars | transparent, hover tint `accent-quiet` |
| **Icon** | ♥ ⇄ 🛒 | square, 40px, focus-visible ring |
Sizes `sm/md/lg`; disabled + loading (spinner) states; ≥44px touch target.

### 5.4 Cards
- **ProductCard**: media (AspectRatio, zero-CLS) · compare checkbox (top-right) · badge (top-left) · brand+title · StockBadge · **KeySpecChips** (mono) · PriceTag · AddToCart. Hover: lift `shadow-md`, image scale ≤1.03, 250ms.
- **CategoryTile**: image/gradient + label, large tap target.
- **ContentCard/TutorialCard**: cover · level chip · title · meta.
Radius `lg` (0.625rem), `shadow-sm` resting, hairline border in light.

### 5.5 Tables (used where they belong, not everywhere)
- **SpecSheet**: grouped by `display_group`, 2-col (label muted / value mono), hairline row rules, collapsible groups. Not a grid dump — grouped and scannable.
- **CompareTable**: sticky first column, horizontal scroll container, **diff-highlighted** rows, key-specs first.
Tabular numerals, generous row height, no zebra-stripe heaviness.

### 5.6 Filters
- **Checkbox facet** (RefinementList): label + live count, searchable when high-cardinality (brand).
- **Range facet**: dual slider + numeric inputs, unit-aware (base-unit filtering, SEARCH §2).
- **Hierarchical**: category tree (ltree).
- **ActiveFilters**: removable chips; DynamicWidgets so the facet set follows results.
- Mobile: bottom sheet + sticky "Filter (n)" bar.

### 5.7 Forms
- Inputs: label always visible, `aria-describedby` hints, `aria-invalid` + inline error (never color-only), focus-visible ring.
- Quote/config fields: OptionCard (radio/checkbox with cost/lead-time delta), FileDrop (chunked upload + progress), stepper.
- Validation: Zod at the boundary; error summary focuses on submit (FRONTEND §10).

### 5.8 Responsive rules
Mobile-first. Breakpoints `sm640 · md768 · lg1024 · xl1280 · 2xl1536`. **Container queries** on cards so they reflow by their own width. Key transforms: filter rail→bottom sheet, buy box→sticky bottom bar, mega menu→drawer, spec/compare tables→horizontal scroll, 3–4 col grid→2 col. Touch ≥44px, safe-area insets, never any body horizontal scroll.

---

## 6. Implementation note

Tokens and the component contracts above map 1:1 onto `packages/ui` + `apps/web/components` (FRONTEND §4). The accompanying **visual concept** (published artifact) renders this system — homepage, storefront preview, and the design-system primitives — in both themes, as the reference to sign off before we build the React components.
