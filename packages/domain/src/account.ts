import type { DocumentDownload, ProductSummary, WarrantyInformation } from "./catalog";
import type { Image, Money } from "./common";

export interface OrderSummary {
  id: string;
  number: string;
  placedAt: string;
  status: "pending" | "processing" | "fulfilled" | "cancelled" | "refunded";
  total: Money;
  itemCount: number;
  trackingUrl?: string;
  items: Array<{ title: string; image: Image | null; quantity: number }>;
}

export interface QuoteLineItem {
  description: string;
  quantity: number;
  targetPrice?: Money;
  product?: ProductSummary;
}

export interface Quote {
  reference: string;
  status:
    | "new"
    | "reviewing"
    | "quoted"
    | "negotiation"
    | "accepted"
    | "won"
    | "lost"
    | "cancelled";
  createdAt: string;
  items: QuoteLineItem[];
  /** Customer-facing quote figures only — never internal notes/margins. */
  latestQuote?: { total: Money; validUntil?: string; status: string };
}

export interface RegisteredDevice {
  productHandle: string;
  name: string;
  serial?: string;
  registeredAt: string;
  warranty?: WarrantyInformation;
}

export interface CustomerDashboard {
  profile: { name: string; email: string; company?: string };
  orders: OrderSummary[];
  savedProducts: ProductSummary[];
  quotes: Quote[];
  downloads: DocumentDownload[];
  devices: RegisteredDevice[];
}

export interface RecentlyViewed {
  items: ProductSummary[];
}
