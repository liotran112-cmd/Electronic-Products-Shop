import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { ProductSummary } from "@repo/domain";

import { CartProvider } from "../../hooks/use-cart";
import { ProductGrid } from "./product-grid";

const product: ProductSummary = {
  id: "gid://shopify/Product/1",
  handle: "esp32-devkit",
  href: "/products/esp32-devkit",
  title: "ESP32 DevKit v1",
  brand: "Espressif",
  image: { url: "https://img.test/1.jpg", alt: "ESP32", width: 400, height: 300 },
  price: { amount: 12.9, currency: "USD", formatted: "$12.90" },
  availability: "in_stock",
  keySpecs: [],
};

describe("ProductGrid", () => {
  it("renders products (listing grid)", () => {
    render(
      <CartProvider>
        <ProductGrid products={[product]} />
      </CartProvider>,
    );
    expect(screen.getByRole("link", { name: "ESP32 DevKit v1" })).toHaveAttribute(
      "href",
      "/products/esp32-devkit",
    );
  });

  it("renders a designed empty state for zero results", () => {
    render(<ProductGrid products={[]} />);
    expect(screen.getByRole("heading", { name: /no products found/i })).toBeInTheDocument();
  });
});
