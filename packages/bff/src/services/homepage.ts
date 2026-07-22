import { TAGS, TTL, withCache } from "@repo/cache";
import type { Homepage } from "@repo/domain";

import { hitToSummary } from "../mappers/summary.mapper";
import * as catalog from "../repositories/catalog.repo";
import * as content from "../repositories/content.repo";
import * as search from "../repositories/search.repo";
import { toImage } from "../support/money";
import { optional } from "../support/settle";

async function build(): Promise<Homepage> {
  const [doc, trending, newArrivals, educational, categories, brands] = await Promise.all([
    optional(content.getHomepageDoc(), null, "home.doc"),
    optional(search.topHits("popularity", 8), [], "home.trending"),
    optional(search.topHits("newest", 8), [], "home.new"),
    optional(content.getEducational(4), [], "home.educational"),
    optional(catalog.listRootCategories(), [], "home.categories"),
    optional(catalog.listActiveBrands(12), [], "home.brands"),
  ]);

  return {
    hero: {
      headline: doc?.hero?.headline ?? "Electronics, beautifully discovered.",
      subline:
        doc?.hero?.subline ??
        "The Apple experience for discovering electronics, with Digi-Key technical depth.",
      image: doc?.hero?.imageUrl ? toImage(doc.hero.imageUrl, "Featured", 1200, 900) : undefined,
      cta: doc?.hero?.ctas ?? [
        { label: "Shop the catalog", href: "/search" },
        { label: "Build a custom device", href: "/custom" },
      ],
      specChips: doc?.hero?.specChips,
    },
    featuredCategories: categories.map((c) => ({
      name: c.name,
      slug: c.slug,
      href: `/c/${c.slug}`,
      image: c.icon_url ? toImage(c.icon_url, c.name, 96, 96) : undefined,
    })),
    trending: trending.map(hitToSummary),
    newArrivals: newArrivals.map(hitToSummary),
    customSolutions: {
      headline: doc?.customSolutions?.headline ?? "Custom electronics, built to spec",
      body:
        doc?.customSolutions?.body ??
        "From IoT gateways to industrial controllers — configure, quote, and manufacture.",
      href: doc?.customSolutions?.href ?? "/custom",
    },
    educational: educational.map((t) => ({
      title: t.title,
      slug: t.slug,
      href: `/learn/${t.slug}`,
      excerpt: t.excerpt,
      level: t.level,
      coverImage: t.coverUrl ? toImage(t.coverUrl, t.title, 640, 360) : undefined,
    })),
    brands: brands.map((b) => ({
      name: b.name,
      slug: b.slug,
      href: `/brands/${b.slug}`,
      logo: b.logo_url ? toImage(b.logo_url, b.name, 160, 60) : undefined,
    })),
    seo: {
      title: "Ampere — Electronics, beautifully discovered",
      description: "Consumer electronics and custom devices with technical depth.",
      canonical: "/",
    },
  };
}

export function getHomepage(): Promise<Homepage> {
  return withCache(build, {
    keyParts: ["homepage"],
    tags: [TAGS.homepage(), TAGS.content(), TAGS.collection()],
    revalidate: TTL.fiveMinutes,
  })();
}
