import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { ProductDetail } from "@repo/domain";

import { ProductView } from "./product-view";

function makeDetail(overrides: Partial<ProductDetail> = {}): ProductDetail {
  return {
    id: "gid://shopify/Product/1",
    handle: "esp32-devkit",
    title: "ESP32 DevKit v1",
    subtitle: "Wi-Fi + Bluetooth development board",
    brand: { name: "Espressif", slug: "espressif" },
    breadcrumbs: [
      { name: "Home", href: "/" },
      { name: "Dev Boards", href: "/c/dev-boards" },
    ],
    gallery: [{ url: "https://img.test/1.jpg", alt: "ESP32", width: 800, height: 800 }],
    price: { amount: 12.9, currency: "USD", formatted: "$12.90" },
    availability: "in_stock",
    variants: [
      {
        id: "v1",
        title: "Default",
        sku: "ESP32-1",
        options: {},
        price: { amount: 12.9, currency: "USD", formatted: "$12.90" },
        availability: "in_stock",
      },
    ],
    keyBenefits: ["Dual-core 240 MHz processor"],
    specificationGroups: [
      {
        name: "Power",
        specifications: [
          { key: "voltage", label: "Operating voltage", value: "3.3", unit: "V", isKeySpec: true },
        ],
      },
    ],
    documents: [{ id: "d1", title: "ESP32 Datasheet", type: "datasheet", url: "https://img.test/ds.pdf" }],
    compatibility: [{ label: "Arduino IDE" }],
    tutorials: [],
    reviews: { average: 4.6, count: 42 },
    accessories: [],
    seo: { title: "ESP32 DevKit v1", description: "A dev board", canonical: "/products/esp32-devkit" },
    isCustom: false,
    ...overrides,
  };
}

const slots = {
  buySlot: <div data-testid="buy-slot" />,
  relatedSlot: <div data-testid="related-slot" />,
};

describe("ProductView", () => {
  it("renders the product identity", () => {
    render(<ProductView detail={makeDetail()} {...slots} />);
    expect(screen.getByRole("heading", { level: 1, name: "ESP32 DevKit v1" })).toBeInTheDocument();
    expect(screen.getByText("Espressif")).toBeInTheDocument();
  });

  it("shows technical specifications", () => {
    render(<ProductView detail={makeDetail()} {...slots} />);
    expect(screen.getByText("Operating voltage")).toBeInTheDocument();
    expect(screen.getByText(/3\.3 V/)).toBeInTheDocument();
  });

  it("shows downloadable documents", () => {
    render(<ProductView detail={makeDetail()} {...slots} />);
    expect(screen.getByText("ESP32 Datasheet")).toBeInTheDocument();
  });

  it("renders the streamed buy + related slots", () => {
    render(<ProductView detail={makeDetail()} {...slots} />);
    expect(screen.getByTestId("buy-slot")).toBeInTheDocument();
    expect(screen.getByTestId("related-slot")).toBeInTheDocument();
  });

  it("degrades gracefully with missing images, specs and documents", () => {
    render(
      <ProductView
        detail={makeDetail({ gallery: [], specificationGroups: [], documents: [] })}
        {...slots}
      />,
    );
    expect(screen.getByText(/no image available/i)).toBeInTheDocument();
    expect(screen.getByText(/specifications coming soon/i)).toBeInTheDocument();
    expect(screen.getByText(/no documents yet/i)).toBeInTheDocument();
  });
});
