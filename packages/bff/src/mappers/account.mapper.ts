import type {
  CustomerDashboard,
  OrderSummary,
  ProductSummary,
  Quote,
  QuoteLineItem,
  RegisteredDevice,
} from "@repo/domain";

import { money } from "../support/money";

export function toQuote(
  quote: { reference: string; status: Quote["status"]; created_at: string },
  items: Array<{ description: string; quantity: number; target_price: number | null; product_id: string | null }>,
  productById: Map<string, ProductSummary>,
): Quote {
  return {
    reference: quote.reference,
    status: quote.status,
    createdAt: quote.created_at,
    items: items.map<QuoteLineItem>((i) => ({
      description: i.description,
      quantity: i.quantity,
      targetPrice: i.target_price != null ? money(i.target_price) : undefined,
      product: i.product_id ? productById.get(i.product_id) : undefined,
    })),
  };
}

export function toDevice(
  row: { product_id: string; serial: string | null; registered_at: string },
  productById: Map<string, ProductSummary>,
): RegisteredDevice {
  const product = productById.get(row.product_id);
  return {
    productHandle: product?.handle ?? row.product_id,
    name: product?.title ?? "Registered device",
    serial: row.serial ?? undefined,
    registeredAt: row.registered_at,
  };
}

export function toDashboard(input: {
  email: string;
  company?: string | null;
  orders: OrderSummary[];
  saved: ProductSummary[];
  quotes: Quote[];
  devices: RegisteredDevice[];
}): CustomerDashboard {
  return {
    profile: { name: input.email, email: input.email, company: input.company ?? undefined },
    orders: input.orders,
    savedProducts: input.saved,
    quotes: input.quotes,
    downloads: [],
    devices: input.devices,
  };
}
