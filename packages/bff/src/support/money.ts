import type { Availability, Image, Money } from "@repo/domain";

export function money(amount: number | null | undefined, currency = "USD"): Money {
  const value = amount ?? 0;
  return {
    amount: value,
    currency,
    formatted: new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value),
  };
}

/** Derive display availability from stock signals (§ ownership: Shopify/mirror). */
export function availabilityFrom(
  inStock: boolean,
  quantity?: number | null,
  leadTimeDays?: number | null,
): Availability {
  if (!inStock) return leadTimeDays && leadTimeDays > 0 ? "backorder" : "out_of_stock";
  if (quantity != null && quantity <= 5) return "low_stock";
  return "in_stock";
}

/** Missing images degrade to a fixed-dimension placeholder → zero CLS (§9). */
export function placeholderImage(alt = "Image coming soon"): Image {
  return { url: "/images/placeholder-product.svg", alt, width: 800, height: 600 };
}

export function toImage(
  url: string | null | undefined,
  alt: string,
  width = 800,
  height = 600,
): Image {
  if (!url) return placeholderImage(alt);
  return { url, alt, width, height };
}
