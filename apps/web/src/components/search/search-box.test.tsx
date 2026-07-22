import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

import { SearchBox } from "./search-box";

describe("SearchBox (query works)", () => {
  it("navigates to the encoded search URL on submit", async () => {
    const user = userEvent.setup();
    render(<SearchBox />);
    await user.type(screen.getByLabelText(/search products/i), "esp32 board");
    await user.keyboard("{Enter}");
    expect(push).toHaveBeenCalledWith("/search?q=esp32%20board");
  });

  it("navigates to bare /search when the query is empty", async () => {
    const user = userEvent.setup();
    push.mockClear();
    render(<SearchBox initialQuery="  " />);
    await user.click(screen.getByRole("button", { name: /search/i }));
    expect(push).toHaveBeenCalledWith("/search");
  });
});
