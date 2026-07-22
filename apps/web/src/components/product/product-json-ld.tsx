import type { Availability, ProductDetail } from "@repo/domain";

const SCHEMA_AVAILABILITY: Record<Availability, string> = {
  in_stock: "https://schema.org/InStock",
  low_stock: "https://schema.org/LimitedAvailability",
  out_of_stock: "https://schema.org/OutOfStock",
  backorder: "https://schema.org/BackOrder",
  preorder: "https://schema.org/PreOrder",
};

/**
 * schema.org/Product structured data for rich results. Priced from the SSR
 * snapshot (crawler-visible, stable); aggregateRating included only when there
 * are reviews. Rendered server-side inside the RSC page.
 */
export function ProductJsonLd({ detail, url }: { detail: ProductDetail; url: string }) {
  const sku = detail.variants[0]?.sku;

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: detail.title,
    description: detail.seo.description,
    image: detail.gallery.map((g) => g.url),
    brand: { "@type": "Brand", name: detail.brand.name },
    ...(sku ? { sku, mpn: sku } : {}),
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: detail.price.currency,
      price: detail.price.amount.toFixed(2),
      availability: SCHEMA_AVAILABILITY[detail.availability],
    },
    ...(detail.reviews.count > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: detail.reviews.average,
            reviewCount: detail.reviews.count,
          },
        }
      : {}),
  };

  return (
    <script
      type="application/ld+json"
      // Server-serialized, no user input interpolated as markup.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
