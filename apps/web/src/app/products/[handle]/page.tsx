import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getProductPage, isNotFoundLike } from "@repo/bff";

import { LiveBuyBox } from "../../../components/product/live-buy-box";
import { ProductBuyBox } from "../../../components/product/product-buy-box";
import { ProductJsonLd } from "../../../components/product/product-json-ld";
import { ProductView } from "../../../components/product/product-view";
import { RelatedProducts } from "../../../components/product/related-products";
import { absoluteUrl } from "../../../lib/site";

interface PageProps {
  params: Promise<{ handle: string }>;
}

/**
 * Product detail (RSC). `getProductPage` is mirror-first and cached; the buy box
 * streams authoritative live pricing via <Suspense>, and related products stream
 * independently. Deleted/draft/missing products map to notFound(); a required
 * upstream failure bubbles to error.tsx.
 *
 * `getProductPage` is React-cache-memoized in the BFF, so the call in
 * generateMetadata and the call here dedupe to a single fetch per request.
 */
async function loadOrNotFound(handle: string) {
  try {
    return await getProductPage(handle);
  } catch (error) {
    if (isNotFoundLike(error)) notFound();
    throw error;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { handle } = await params;
  let detail;
  try {
    detail = await getProductPage(handle);
  } catch {
    return { title: "Product not found", robots: { index: false, follow: false } };
  }

  const { seo } = detail;
  const ogImage = seo.ogImage ?? detail.gallery[0]?.url;
  return {
    title: seo.title,
    description: seo.description,
    alternates: { canonical: seo.canonical },
    openGraph: {
      type: "website",
      title: seo.title,
      description: seo.description,
      url: seo.canonical,
      images: ogImage ? [{ url: ogImage }] : [],
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { handle } = await params;
  const detail = await loadOrNotFound(handle);

  return (
    <>
      <ProductJsonLd detail={detail} url={absoluteUrl(detail.seo.canonical)} />
      <ProductView
        detail={detail}
        buySlot={
          <Suspense fallback={<ProductBuyBox detail={detail} />}>
            <LiveBuyBox detail={detail} />
          </Suspense>
        }
        relatedSlot={
          <Suspense fallback={null}>
            <RelatedProducts handle={handle} />
          </Suspense>
        }
      />
    </>
  );
}
