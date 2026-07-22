import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { Facet } from "@repo/domain";

import { FacetSidebar } from "./facet-sidebar";

const facets: Facet[] = [
  {
    attribute: "vendor",
    label: "Brand",
    type: "list",
    values: [
      { value: "Espressif", label: "Espressif", count: 120, selected: false },
      { value: "Adafruit", label: "Adafruit", count: 80, selected: false },
    ],
  },
];

describe("FacetSidebar (URL-driven faceting)", () => {
  it("renders each facet value as a toggle link", () => {
    render(<FacetSidebar facets={facets} searchParams={{}} pathname="/c/dev-boards" />);
    const link = screen.getByRole("link", { name: /filter by espressif/i });
    expect(link.getAttribute("href")).toContain("refine=vendor%3AEspressif");
  });

  it("marks an active facet as removable", () => {
    render(
      <FacetSidebar
        facets={facets}
        searchParams={{ refine: "vendor:Espressif" }}
        pathname="/c/dev-boards"
      />,
    );
    expect(screen.getByRole("link", { name: /remove filter espressif/i })).toBeInTheDocument();
  });

  it("renders nothing when no facet has values", () => {
    const { container } = render(
      <FacetSidebar
        facets={[{ attribute: "x", label: "X", type: "list", values: [] }]}
        searchParams={{}}
        pathname="/c/x"
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
