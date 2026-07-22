/** Shared, frontend-safe value objects. */

export interface Money {
  /** Numeric amount in major units (e.g. 12.9). */
  amount: number;
  /** ISO 4217 code, e.g. "USD". */
  currency: string;
  /** Presentation string, e.g. "$12.90". Formatted server-side (locale-stable). */
  formatted: string;
}

export interface Image {
  url: string;
  alt: string;
  width: number;
  height: number;
  blurDataURL?: string;
}

export interface Breadcrumb {
  name: string;
  href: string;
}

export type Availability =
  | "in_stock"
  | "low_stock"
  | "out_of_stock"
  | "backorder"
  | "preorder";

export interface Seo {
  title: string;
  description: string;
  canonical: string;
  ogImage?: string;
}

/** Opaque rich-text blocks (portable text). The renderer owns interpretation. */
export type RichText = Array<{ type: string; text?: string; children?: RichText }>;
