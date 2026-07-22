"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

import { Button, Input } from "@repo/ui";

/**
 * Prominent search field for the search page (client leaf). Submitting starts a
 * fresh query in the URL — the page itself renders results server-side.
 */
export function SearchBox({ initialQuery = "" }: { initialQuery?: string }) {
  const router = useRouter();
  const [value, setValue] = React.useState(initialQuery);

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        const q = value.trim();
        router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
      }}
      className="flex gap-2"
    >
      <div className="relative flex-1">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-label="Search products"
          placeholder="Search 10,000+ products, specs, part numbers…"
          className="h-11 pl-9"
          autoFocus
        />
      </div>
      <Button type="submit" size="lg">
        Search
      </Button>
    </form>
  );
}
