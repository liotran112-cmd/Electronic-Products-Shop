import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StockIndicator } from "./stock-indicator";
import { RatingSummary } from "./rating-summary";

describe("StockIndicator (a11y: status by text, not color alone)", () => {
  it("renders a text label with count for in/low stock", () => {
    render(<StockIndicator availability="low_stock" count={3} />);
    expect(screen.getByText("Low stock")).toBeInTheDocument();
    expect(screen.getByText(/3/)).toBeInTheDocument();
  });

  it("omits the count when out of stock", () => {
    render(<StockIndicator availability="out_of_stock" count={0} />);
    expect(screen.getByText("Out of stock")).toBeInTheDocument();
    expect(screen.queryByText(/^· /)).not.toBeInTheDocument();
  });
});

describe("RatingSummary (a11y)", () => {
  it("exposes an accessible, screen-reader-friendly rating label", () => {
    render(<RatingSummary rating={{ average: 4.7, count: 128 }} />);
    expect(screen.getByLabelText(/rated 4\.7 out of 5 from 128 reviews/i)).toBeInTheDocument();
  });
});
