import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { CartProvider } from "../../hooks/use-cart";
import { AddToCartButton } from "./product-card-actions";

const line = { id: "v1", handle: "esp32", title: "ESP32", price: 12.9, currency: "USD", image: null };

beforeEach(() => localStorage.clear());

describe("AddToCartButton (interaction)", () => {
  it("has an accessible name and adds to cart on click", async () => {
    const user = userEvent.setup();
    render(
      <CartProvider>
        <AddToCartButton line={line} />
      </CartProvider>,
    );

    const button = screen.getByRole("button", { name: /add esp32 to cart/i });
    await user.click(button);

    expect(screen.getByRole("button", { name: /esp32 added to cart/i })).toBeInTheDocument();
  });

  it("is keyboard operable (Enter activates)", async () => {
    const user = userEvent.setup();
    render(
      <CartProvider>
        <AddToCartButton line={line} />
      </CartProvider>,
    );
    await user.tab();
    expect(screen.getByRole("button", { name: /add esp32 to cart/i })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("button", { name: /added/i })).toBeInTheDocument();
  });
});
