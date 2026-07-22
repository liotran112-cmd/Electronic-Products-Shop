import { getRelatedProducts } from "@repo/bff";
import type { RelatedProduct } from "@repo/domain";

import { RelatedProductCard } from "./related-product-card";

/**
 * Streamed related-products rail (async RSC behind Suspense). Optional: any
 * failure or empty result renders nothing rather than blocking the page.
 */
export async function RelatedProducts({ handle }: { handle: string }) {
  let related: RelatedProduct[] = [];
  try {
    related = await getRelatedProducts(handle);
  } catch {
    return null;
  }
  if (related.length === 0) return null;

  return (
    <section aria-labelledby="related-heading" className="mt-16">
      <h2 id="related-heading" className="mb-4 text-lg font-semibold">
        You might also like
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {related.slice(0, 6).map((item) => (
          <RelatedProductCard key={item.product.id} related={item} />
        ))}
      </div>
    </section>
  );
}
