import type { Availability, Breadcrumb, Image, Money, RichText, Seo } from "./common";

export interface Specification {
  key: string;
  label: string;
  value: string; // display-ready, e.g. "5 V"
  unit?: string;
  isKeySpec: boolean;
}

export interface SpecificationGroup {
  name: string; // display_group, e.g. "Power"
  specifications: Specification[];
}

export interface ReviewSummary {
  average: number;
  count: number;
  distribution?: Record<1 | 2 | 3 | 4 | 5, number>;
}

export interface DocumentDownload {
  id: string;
  title: string;
  type: "manual" | "datasheet" | "cad" | "certificate" | "schematic";
  url: string;
  sizeLabel?: string;
  language?: string;
  version?: string;
}

export interface TutorialPreview {
  title: string;
  slug: string;
  href: string;
  excerpt?: string;
  level?: string;
  coverImage?: Image;
}

export interface WarrantyInformation {
  durationLabel: string;
  summary: string;
  url?: string;
}

export interface ProductVariant {
  id: string;
  title: string;
  sku: string;
  options: Record<string, string>;
  price: Money;
  compareAtPrice?: Money;
  availability: Availability;
  leadTimeDays?: number;
}

export interface ProductSummary {
  id: string;
  handle: string;
  href: string;
  title: string;
  brand: string;
  image: Image | null;
  price: Money;
  compareAtPrice?: Money;
  availability: Availability;
  rating?: ReviewSummary;
  keySpecs: Specification[];
  badges?: string[];
}

export interface Accessory {
  product: ProductSummary;
  note?: string;
}

export interface ProductDetail {
  id: string;
  handle: string;
  title: string;
  subtitle?: string;
  brand: { name: string; slug: string; logo?: Image };
  breadcrumbs: Breadcrumb[];
  gallery: Image[];
  price: Money; // snapshot for SSR/SEO; authoritative price via LivePricing
  compareAtPrice?: Money;
  availability: Availability;
  variants: ProductVariant[];
  keyBenefits: string[];
  description?: RichText;
  specificationGroups: SpecificationGroup[];
  documents: DocumentDownload[];
  compatibility: Array<{ label: string; href?: string }>;
  tutorials: TutorialPreview[];
  reviews: ReviewSummary;
  accessories: Accessory[];
  seo: Seo;
  isCustom: boolean;
}

/** Authoritative live price/stock (Shopify) — streamed into the buy box. */
export interface LivePricing {
  variants: Array<{
    id: string;
    price: Money;
    compareAtPrice?: Money;
    availability: Availability;
    quantityAvailable: number;
  }>;
  updatedAt: string;
}
