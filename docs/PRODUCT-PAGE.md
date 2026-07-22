# The Product Detail Page (PDP)

> The page where Shopify + Supabase + Sanity converge. Companion to [FRONTEND.md](./FRONTEND.md) (§7 PDP row), [DATA-MODEL.md](./DATA-MODEL.md), [ARCHITECTURE.md](./ARCHITECTURE.md).
> Design goal: **Apple product storytelling + Digi-Key technical information** in *one adaptive template*.

---

## 1. The core idea: one template, four archetypes

A smartphone PDP and an industrial-controller PDP are the same *skeleton* with different *weighting*. We do not build separate templates — that fragments and rots. Instead the PDP is **data-driven**: every section renders only if its data exists, and a per-archetype **section priority** reorders and emphasizes.

```ts
// lib/pdp/archetype.ts — decides emphasis, not layout existence
type Archetype = 'consumer_flagship' | 'consumer_accessory' | 'technical' | 'custom_quote';

function resolveArchetype(p: Product): Archetype {
  if (p.kind === 'custom' || p.is_quotable) return 'custom_quote';
  if (p.primary_category.path.startsWith('accessories')) return 'consumer_accessory';
  if (p.kind === 'consumer' && p.has_story) return 'consumer_flagship';
  return 'technical';
}
```

| Archetype | Leads with | Buy action | Story | Specs | Downloads |
|---|---|---|---|---|---|
| **consumer_flagship** (smartphone, wearable) | Apple story band | Add to cart | ★★★ hero | ★★ collapsed-expandable | ★ |
| **consumer_accessory** | compact buy + compatibility | Add to cart | ★ | ★★ | ★ |
| **technical** (dev board, controller) | spec sheet + downloads | Add to cart / bulk | ★ concise overview | ★★★ full parametric | ★★★ datasheets/CAD/firmware |
| **custom_quote** (IoT, industrial, embedded) | capabilities + quote CTA | **Request quote** | ★★ | ★★ target specs | ★★ reference docs |

Same components, config-driven order. This is what lets the *same page* feel like Apple for a phone and Digi-Key for a controller.

---

## 2. Page layout

### Desktop (technical archetype shown; flagship swaps bands 2↔4 emphasis)

```
┌──────────────────────────────────────────────────────────────────────┐
│ Header · MegaMenu                                                       │
├──────────────────────────────────────────────────────────────────────┤
│ Home › Dev Boards › MCU Boards › ESP32 DevKit V1        (Breadcrumbs)  │
├───────────────────────────────────────┬──────────────────────────────┤
│                                        │  ESP32 DevKit V1   [Brand]    │
│         GALLERY                        │  ★4.7 (128) · MPN ESP32-…     │
│   [ zoom · thumbnails · 360 ]          │  ── KeySpecStrip ──           │
│   (LCP element, priority image)        │  5V · ESP32 · WiFi+BT         │
│                                        │  ┌── BuyBox (sticky) ──────┐  │
│                                        │  │ $12.90                   │  │
│                                        │  │ ● In stock (1,204)       │  │
│                                        │  │ Variant: [Header ▾]      │  │
│                                        │  │ Qty [− 1 +]  price breaks│  │
│                                        │  │ [ Add to cart ]  ♥ ⇄     │  │
│                                        │  │ Ships today · Free >$50  │  │
│                                        │  │ Datasheet ↓ · Add to ⇄   │  │
│                                        │  └──────────────────────────┘  │
├───────────────────────────────────────┴──────────────────────────────┤
│ ▸ Sticky sub-nav (scrollspy): Overview·Specs·Compatibility·Downloads·  │
│   Reviews·Tutorials·Q&A                                                 │
├──────────────────────────────────────────────────────────────────────┤
│ OVERVIEW — story band (Apple): editorial, feature imagery (Sanity)     │
├──────────────────────────────────────────────────────────────────────┤
│ SPECIFICATIONS — grouped parametric table (Digi-Key), mono values      │
│   Power ▸  Processor ▸  Connectivity ▸  Environment ▸  Physical ▸       │
├──────────────────────────────────────────────────────────────────────┤
│ COMPATIBILITY — works-with chips (products + platforms/standards)       │
├──────────────────────────────────────────────────────────────────────┤
│ DOWNLOADS — Datasheets · Manuals · CAD/STEP · Firmware (gated table)    │
├──────────────────────────────────────────────────────────────────────┤
│ TUTORIALS & GUIDES — TutorialRail (Sanity)                             │
├──────────────────────────────────────────────────────────────────────┤
│ REVIEWS — summary + list (mirror) · Q&A                                │
├──────────────────────────────────────────────────────────────────────┤
│ ACCESSORIES  ·  FREQUENTLY BOUGHT TOGETHER  ·  ALTERNATIVES (rails)     │
├──────────────────────────────────────────────────────────────────────┤
│ Recently viewed · Footer                                               │
└──────────────────────────────────────────────────────────────────────┘
```

### Mobile
Gallery (swipe) → title + KeySpecStrip → **story or specs first per archetype** → collapsed Accordion sections → rails. **Sticky bottom bar**: price + primary CTA always visible. Sub-nav becomes a horizontal scroll chip row.

---

## 3. Component breakdown

| Component | RSC / Island | PPR | Source | Notes |
|---|---|---|---|---|
| `Breadcrumbs` | RSC | static | Supabase taxonomy | emits `BreadcrumbList` JSON-LD |
| `ImageGallery` | **island** (`dynamic`) | static shell, hydrate-on-interaction | Cloudinary | LCP = first image, `priority`; zoom/360/swipe |
| `ProductHeader` (title, brand, rating, MPN) | RSC | static | Supabase + reviews mirror | |
| `KeySpecStrip` | RSC | static | Supabase (`is_key_spec`) | 3–5 headline specs as chips |
| `BuyBox` | **island** | **dynamic** (streamed) | **Shopify** (live price/stock) | variant, qty, price breaks, add-to-cart Server Action |
| `StockBadge` | island (in BuyBox) | dynamic | Shopify + inventory | in/low/backorder/lead-time |
| `TrustBar` | RSC | static | config | shipping/returns/warranty cues |
| `StoryBand` / `FeatureBand` | RSC | static | **Sanity** (PortableText) | Apple storytelling |
| `SpecSheet` | RSC | static | **Supabase** specs | grouped by `display_group`, mono values, expand/collapse groups |
| `CompatibilityList` | RSC | static | Supabase `compatibility` | product + platform chips, linkable |
| `DownloadsPanel` | RSC + gated island | static list / dynamic auth | Supabase `documents`+`firmware` | datasheets/CAD/manuals public; firmware via signed-URL flow |
| `FirmwareTable` | island (download btn) | dynamic (entitlement) | Supabase + Storage | version, channel, checksum, size |
| `TutorialRail` | RSC | static | Sanity `product_tutorials` | |
| `ReviewSummary` + `ReviewList` | RSC (+ island form) | static + dynamic | reviews mirror | histogram, verified badge |
| `QAndA` | RSC + island | static + dynamic | Supabase/app | emits `FAQPage` |
| `AccessoriesRail` / `FrequentlyBought` / `Alternatives` | RSC or **island** | dynamic (personalized) | `product_relations` + Algolia Recommend + PostHog | |
| `RecentlyViewed` | island | dynamic | localStorage/PostHog | |
| `StickyBuyBar` (mobile) | island | dynamic | Shopify | |
| `AddToCompareButton` | island | — | compare store | technical archetype prominence |
| `RequestQuoteCTA` | island | — | → quote Server Action | replaces BuyBox for `custom_quote` |

**PPR boundary:** the entire page is a prerendered static shell (breadcrumbs, gallery, header, specs, downloads, tutorials, story) with **one Suspense boundary around commerce** (`BuyBox` + personalized rails) that streams live Shopify/Algolia data. Static shell → instant LCP + full SEO; commerce → always fresh.

---

## 4. Data requirements — the PDP data contract

The page Server Component assembles a single typed view by fetching the three sources **in parallel** (no waterfall), keyed by `handle`:

```ts
// lib/pdp/getProductPage.ts  → returns ProductPageData
export interface ProductPageData {
  // ── identity & taxonomy (Supabase) ──────────────────────────
  id: string; handle: string; title: string; subtitle?: string;
  mpn?: string; gtin?: string; kind: 'consumer' | 'custom';
  brand: { slug: string; name: string; logoUrl?: string };
  breadcrumbs: { name: string; href: string }[];
  archetype: Archetype;

  // ── media (Cloudinary) ──────────────────────────────────────
  gallery: { url: string; alt: string; width: number; height: number; kind: 'image'|'video'|'360' }[];

  // ── commerce (Shopify, streamed in BuyBox) ──────────────────
  commerce: {
    variants: {
      id: string; sku: string; title: string; options: Record<string,string>;
      price: Money; compareAt?: Money; availableForSale: boolean;
      quantityAvailable: number; leadTimeDays?: number;
    }[];
    priceBreaks?: { minQty: number; price: Money }[];
    shipsToday: boolean; freeShippingThreshold?: Money;
  };

  // ── technical (Supabase) ────────────────────────────────────
  specGroups: { group: string; specs: {
    key: string; name: string; display: string; unit?: string; isKey: boolean;
  }[] }[];
  compatibility: { kind: 'product'|'platform'|'standard'; name: string; href?: string; notes?: string }[];
  documents: { type: 'datasheet'|'manual'|'cad'|'certificate'|'schematic';
               title: string; url: string; sizeBytes?: number; isPublic: boolean; version?: string }[];
  firmware: { version: string; channel: string; checksum: string; sizeBytes: number;
              isPublic: boolean; requiresEntitlement: boolean; publishedAt: string }[];

  // ── story & content (Sanity) ────────────────────────────────
  story?: { hero?: PortableText; featureBands: FeatureBand[] };
  tutorials: { title: string; slug: string; level?: string; coverUrl?: string }[];

  // ── social proof (reviews mirror) ───────────────────────────
  reviews: { avg: number; count: number; histogram: Record<1|2|3|4|5, number> };

  // ── merchandising (relations + Algolia Recommend, streamed) ─
  accessories: ProductCardData[];
  frequentlyBought: ProductCardData[];
  alternatives: ProductCardData[];

  seo: { title: string; description: string; canonical: string; ogImage: string };
}
```

**Fetch plan (parallel):**
```
Promise.all([
  supabase: product + specGroups + compatibility + documents + firmware + tutorials-links + breadcrumbs,
  sanity:   story + feature bands (GROQ by handle),
  reviews:  aggregate (mirror),
])          // → static shell
Shopify commerce + Algolia Recommend  // → streamed inside Suspense (BuyBox / rails)
```
The static shell never blocks on Shopify; the price/stock stream in. Page is tagged `product:{handle}` for on-demand revalidation on any source change (§ARCHITECTURE 4.1).

---

## 5. SEO metadata

```ts
// app/(shop)/products/[handle]/page.tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  const p = await getProductMeta(params.handle);
  const title = `${p.title} — ${p.brand.name}${p.mpn ? ` (${p.mpn})` : ''}`;
  const description = p.seoDescription
    ?? `${p.title} by ${p.brand.name}. ${p.keySpecsSentence} In stock, fast shipping, datasheets & firmware.`;
  return {
    title, description,
    alternates: { canonical: `/products/${p.handle}` },   // defeats variant/param dupes
    openGraph: {
      title, description, type: 'website',
      url: `/products/${p.handle}`,
      images: [{ url: `/products/${p.handle}/opengraph-image`, width: 1200, height: 630 }],
    },
    twitter: { card: 'summary_large_image', title, description },
    robots: { index: p.status === 'active', follow: true },
  };
}
```

- **Title pattern:** `{Product} — {Brand} ({MPN})` — brand + MPN capture high-intent technical searches (Digi-Key/Mouser behavior).
- **Dynamic OG image** (`opengraph-image.tsx`, `next/og`): product shot + title + 2–3 key specs + price/stock badge.
- **Canonical** to the clean handle; variant selection uses query params that canonicalize back.
- **`hreflang`** slots reserved for i18n.

---

## 6. Structured data (JSON-LD)

The parametric specs become machine-readable via `Product.additionalProperty` — this is how technical specs earn rich results and feed Google's product understanding.

```jsonc
// <script type="application/ld+json"> emitted server-side
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Product",
      "@id": "https://shop.example.com/products/esp32-devkit-v1#product",
      "name": "ESP32 DevKit V1",
      "brand": { "@type": "Brand", "name": "Espressif" },
      "mpn": "ESP32-DEVKITC-32D",
      "sku": "ESP32-DEVKIT-V1",
      "image": ["https://res.cloudinary.com/.../esp32-1.jpg"],
      "description": "ESP32 development board with Wi-Fi + Bluetooth, 5V supply, -40 to 85 °C.",
      "category": "Development Boards > MCU Boards",
      "additionalProperty": [
        { "@type": "PropertyValue", "name": "Supply Voltage", "value": "5", "unitText": "V" },
        { "@type": "PropertyValue", "name": "CPU", "value": "ESP32" },
        { "@type": "PropertyValue", "name": "Connectivity", "value": "Wi-Fi, Bluetooth" },
        { "@type": "PropertyValue", "name": "Operating Temperature", "minValue": -40, "maxValue": 85, "unitText": "CEL" }
      ],
      "aggregateRating": { "@type": "AggregateRating", "ratingValue": 4.7, "reviewCount": 128 },
      "offers": {
        "@type": "Offer",
        "price": "12.90", "priceCurrency": "USD",
        "availability": "https://schema.org/InStock",
        "itemCondition": "https://schema.org/NewCondition",
        "url": "https://shop.example.com/products/esp32-devkit-v1",
        "shippingDetails": { "@type": "OfferShippingDetails", "shippingRate": {
          "@type": "MonetaryAmount", "value": "0", "currency": "USD" } }
      }
    },
    { "@type": "BreadcrumbList", "itemListElement": [ /* Home › Dev Boards › MCU Boards › product */ ] },
    { "@type": "FAQPage", "mainEntity": [ /* from Q&A */ ] },
    { "@type": "TechArticle", "headline": "Getting started with the ESP32 DevKit", "url": ".../learn/..." }
  ]
}
```

Emitted **server-side** (in the RSC), validated in CI against schema.org shapes. `additionalProperty` is generated directly from `specGroups`, so specs and structured data can never drift.

---

## 7. Conversion optimization strategy

Two buyer types, two conversion models — the page serves both.

### Consumer (B&H/Apple mechanics)
- **Above-the-fold clarity:** price, stock, primary CTA visible without scroll; sticky BuyBox (desktop) + sticky bottom bar (mobile) keep the CTA reachable through the whole page.
- **Trust cues (B&H):** `TrustBar` — free-shipping threshold, return window, warranty, authorized-dealer/authenticity. Reduces the "should I buy here" hesitation.
- **Stock/urgency, honestly:** real quantity + "ships today if ordered within…"; low-stock only when true. No dark patterns (protects brand + a11y + legal).
- **Financing/price framing:** monthly financing line where offered; compare-at strike; per-unit price on multipacks.
- **Frictionless variants:** variant selector reflects live availability; out-of-stock variants show lead time, not a dead end.
- **Social proof:** rating + count near title (secondary LCP zone), review histogram, verified badges, photo reviews.
- **Cross-sell that converts:** `FrequentlyBoughtTogether` (bundle add), `AccessoriesRail` (from `product_relations`), `Alternatives` (Algolia Recommend) — increases AOV without cluttering the hero.

### Technical / B2B (Digi-Key mechanics)
- **Datasheet download = micro-conversion.** Prominent, one click, no gate for public docs — engineers evaluate before buying; capturing that intent (PostHog event) enables retargeting and signals purchase intent.
- **Spec confidence:** complete, grouped, mono-formatted spec sheet + `AddToCompare` — the technical buyer decides by comparison, so make comparison one click from the PDP.
- **Stock + lead-time transparency:** exact quantity, lead time for backorder, price breaks by quantity — the Digi-Key expectation; hiding it loses B2B trust.
- **Bulk & quote path:** quantity price breaks inline; "Need 500+? Request a quote" → the custom-quote flow. For `custom_quote` archetype the CTA *is* Request Quote.
- **Post-purchase retention:** firmware, manuals, CAD, tutorials keep the customer returning — the page is also a support surface, which drives loyalty and repeat purchase.

### Measurement & iteration
- **PostHog funnels:** view → variant-select → add-to-cart → checkout; and view → datasheet → add-to-compare → cart. Instrument each CTA.
- **Feature flags / A/B:** BuyBox layout, trust-bar copy, rail ordering, CTA text — all flag-gated, tested on real traffic; no deploy to experiment.
- **Guardrail:** every conversion tactic must respect the priority order (Speed → A11y → SEO → Premium). A tactic that adds CLS, blocks the LCP image, or fakes urgency is rejected in review.

---

## 8. Why this satisfies "Apple + Digi-Key" in one page

- The **hero + story band + motion + restraint** deliver the Apple product narrative for products that warrant it.
- The **grouped parametric spec sheet, compatibility, downloads, comparison, price-breaks, lead times** deliver the Digi-Key technical depth.
- The **archetype system** shifts emphasis so neither buyer sees a page built for the other — a phone doesn't drown in an EAV table, a controller doesn't hide its datasheet behind lifestyle photography.
- One template, one data contract, one set of components — **maintainable at 10,000+ SKUs**, which is the whole point.
```
