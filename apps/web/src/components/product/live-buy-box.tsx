import { getLivePricing } from "@repo/bff";
import type { ProductDetail } from "@repo/domain";

import { ProductBuyBox } from "./product-buy-box";

/**
 * Async server wrapper that streams authoritative price/stock into the buy box.
 * Rendered inside <Suspense fallback={<ProductBuyBox detail />}>, so the snapshot
 * box is interactive immediately and reconciles when live data arrives. If the
 * live source degrades, the snapshot box remains fully functional.
 */
export async function LiveBuyBox({ detail }: { detail: ProductDetail }) {
  try {
    const live = await getLivePricing(detail.handle);
    return <ProductBuyBox detail={detail} live={live} />;
  } catch {
    return <ProductBuyBox detail={detail} />;
  }
}
