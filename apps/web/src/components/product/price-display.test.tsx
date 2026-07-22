import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { Money } from "@repo/domain";

import { PriceDisplay } from "./price-display";

const money = (amount: number, formatted: string): Money => ({ amount, currency: "USD", formatted });

describe("PriceDisplay", () => {
  it("renders the formatted price", () => {
    render(<PriceDisplay price={money(12.9, "$12.90")} />);
    expect(screen.getByText("$12.90")).toBeInTheDocument();
  });

  it("shows a struck-through compare-at price when on sale", () => {
    render(<PriceDisplay price={money(10, "$10.00")} compareAtPrice={money(15, "$15.00")} />);
    expect(screen.getByText("$15.00")).toHaveClass("line-through");
  });

  it("hides compare-at price when it is not higher than price", () => {
    render(<PriceDisplay price={money(10, "$10.00")} compareAtPrice={money(8, "$8.00")} />);
    expect(screen.queryByText("$8.00")).not.toBeInTheDocument();
  });
});
