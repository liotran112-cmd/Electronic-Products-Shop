import type {
  Breadcrumb,
  DocumentDownload,
  Image,
  ProductDetail,
  ProductSummary,
  ProductVariant,
  RichText,
  TutorialPreview,
} from "@repo/domain";

import type { CatalogProduct } from "../repositories/catalog.repo";
import type { ProductEditorialDoc } from "../repositories/content.repo";
import { availabilityFrom, money, placeholderImage, toImage } from "../support/money";
import { toSpecGroups } from "./specs.mapper";

function formatBytes(bytes: number | null): string | undefined {
  if (!bytes) return undefined;
  const mb = bytes / 1_000_000;
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(bytes / 1000)} KB`;
}

const DOC_TYPE_MAP: Record<CatalogProduct["documents"][number]["docType"], DocumentDownload["type"]> = {
  manual: "manual",
  datasheet: "datasheet",
  certificate: "certificate",
  cad: "cad",
  schematic: "schematic",
  guide: "manual",
};

function buildGallery(catalog: CatalogProduct, editorial: ProductEditorialDoc | null): Image[] {
  const images: Image[] = [];
  if (catalog.heroImageUrl) images.push(toImage(catalog.heroImageUrl, catalog.title, 1200, 1200));
  for (const url of editorial?.galleryUrls ?? []) images.push(toImage(url, catalog.title, 1200, 1200));
  return images.length > 0 ? images : [placeholderImage(catalog.title)];
}

function buildDocuments(
  catalog: CatalogProduct,
  editorial: ProductEditorialDoc | null,
): DocumentDownload[] {
  const fromCatalog: DocumentDownload[] = catalog.documents.map((d) => ({
    id: d.id,
    title: d.title,
    type: DOC_TYPE_MAP[d.docType],
    url: d.url,
    sizeLabel: formatBytes(d.sizeBytes),
    language: d.language ?? undefined,
    version: d.version ?? undefined,
  }));
  const manuals: DocumentDownload[] = (editorial?.manuals ?? []).map((m, i) => ({
    id: `manual-${i}`,
    title: m.title,
    type: "manual",
    url: m.url,
    version: m.version,
  }));
  return [...fromCatalog, ...manuals];
}

function buildTutorials(editorial: ProductEditorialDoc | null): TutorialPreview[] {
  return (editorial?.tutorials ?? []).map((t) => ({
    title: t.title,
    slug: t.slug,
    href: `/learn/${t.slug}`,
    excerpt: t.excerpt,
    level: t.level,
    coverImage: t.coverUrl ? toImage(t.coverUrl, t.title, 640, 360) : undefined,
  }));
}

function buildBreadcrumbs(catalog: CatalogProduct): Breadcrumb[] {
  const crumbs: Breadcrumb[] = [{ name: "Home", href: "/" }];
  if (catalog.primaryCategory) {
    crumbs.push({ name: catalog.primaryCategory.name, href: `/c/${catalog.primaryCategory.slug}` });
  }
  crumbs.push({ name: catalog.title, href: `/products/${catalog.handle}` });
  return crumbs;
}

function mapVariants(catalog: CatalogProduct): ProductVariant[] {
  return catalog.variants.map((v) => ({
    id: v.shopifyVariantId ?? v.id,
    title: v.title ?? "Default",
    sku: v.sku,
    options: v.optionValues,
    price: money(v.priceSnapshot, v.currency),
    availability: availabilityFrom(v.priceSnapshot != null),
  }));
}

/**
 * Compose a ProductDetail from the Supabase catalog core + optional Sanity
 * editorial + Algolia-derived accessories. Price is a SNAPSHOT (from the
 * mirror) for SSR/SEO; the buy box refreshes via getLivePricing (§8).
 */
export function toProductDetail(
  catalog: CatalogProduct,
  editorial: ProductEditorialDoc | null,
  accessories: ProductSummary[],
): ProductDetail {
  const prices = catalog.variants.map((v) => v.priceSnapshot).filter((p): p is number => p != null);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const currency = catalog.variants[0]?.currency ?? "USD";

  return {
    id: catalog.id,
    handle: catalog.handle,
    title: catalog.title,
    subtitle: catalog.subtitle ?? undefined,
    brand: {
      name: catalog.brand?.name ?? "",
      slug: catalog.brand?.slug ?? "",
      logo: catalog.brand?.logoUrl ? toImage(catalog.brand.logoUrl, catalog.brand.name, 160, 60) : undefined,
    },
    breadcrumbs: buildBreadcrumbs(catalog),
    gallery: buildGallery(catalog, editorial),
    price: money(minPrice, currency),
    availability: availabilityFrom(prices.length > 0), // snapshot; live overrides in buy box
    variants: mapVariants(catalog),
    keyBenefits: editorial?.keyBenefits ?? [],
    description: (editorial?.description as unknown as RichText) ?? undefined,
    specificationGroups: toSpecGroups(catalog.specs),
    documents: buildDocuments(catalog, editorial),
    compatibility: catalog.compatibility
      .filter((c) => c.label)
      .map((c) => ({ label: c.label })),
    tutorials: buildTutorials(editorial),
    reviews: { average: catalog.ratingAvg ?? 0, count: catalog.ratingCount },
    accessories: accessories.map((product) => ({ product })),
    seo: {
      title: `${catalog.title}${catalog.brand ? ` — ${catalog.brand.name}` : ""}`,
      description: catalog.subtitle ?? `${catalog.title} — specifications, documents and more.`,
      canonical: `/products/${catalog.handle}`,
      ogImage: catalog.heroImageUrl ?? undefined,
    },
    isCustom: catalog.kind === "custom" || catalog.isQuotable,
  };
}
