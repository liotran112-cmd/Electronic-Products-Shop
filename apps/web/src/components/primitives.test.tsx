import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PackageSearch } from "lucide-react";
import { describe, expect, it, vi } from "vitest";

import { Badge, Button, EmptyState, ErrorState } from "@repo/ui";

describe("Button", () => {
  it("renders and handles clicks", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Go</Button>);
    await user.click(screen.getByRole("button", { name: "Go" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("renders as a link with asChild", () => {
    render(
      <Button asChild>
        <a href="/browse">Browse</a>
      </Button>,
    );
    expect(screen.getByRole("link", { name: "Browse" })).toHaveAttribute("href", "/browse");
  });

  it("does not fire when disabled", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Nope
      </Button>,
    );
    await user.click(screen.getByRole("button", { name: "Nope" }));
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe("Badge", () => {
  it("renders its content", () => {
    render(<Badge variant="success">New</Badge>);
    expect(screen.getByText("New")).toBeInTheDocument();
  });
});

describe("EmptyState / ErrorState (a11y)", () => {
  it("EmptyState exposes a heading", () => {
    render(<EmptyState icon={PackageSearch} title="No products" description="Try again" />);
    expect(screen.getByRole("heading", { name: "No products" })).toBeInTheDocument();
  });

  it("ErrorState announces via role=alert", () => {
    render(<ErrorState title="Failed" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Failed");
  });
});
