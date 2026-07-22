"use client";

import * as React from "react";
import Link from "next/link";
import { Search } from "lucide-react";

import { Dialog, DialogContent, DialogTitle, DialogTrigger, Input } from "@repo/ui";

import { useSearch } from "../../hooks/use-search";

/** Search-first entry: ⌘K / click opens a command-style dialog backed by the BFF. */
export function SearchEntry() {
  const { result, loading, query } = useSearch();
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label="Search products"
          className="flex h-10 items-center gap-2 rounded-full border bg-secondary/50 px-3 text-sm text-muted-foreground transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Search className="size-4" aria-hidden />
          <span className="hidden md:inline">Search products…</span>
          <kbd className="ml-2 hidden rounded border bg-background px-1.5 font-mono text-[10px] md:inline">
            ⌘K
          </kbd>
        </button>
      </DialogTrigger>
      <DialogContent className="top-[12%] max-w-xl translate-y-0 gap-0 p-0">
        <DialogTitle className="sr-only">Search products</DialogTitle>
        <div className="flex items-center gap-2 border-b px-4">
          <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <Input
            className="h-12 border-0 px-0 focus-visible:ring-0"
            placeholder="Search 10,000+ products, specs, part numbers…"
            onChange={(e) => query({ query: e.target.value })}
            autoFocus
            aria-label="Search query"
          />
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {loading ? (
            <p className="p-3 text-sm text-muted-foreground">Searching…</p>
          ) : result && result.items.length > 0 ? (
            <ul>
              {result.items.slice(0, 8).map((p) => (
                <li key={p.id}>
                  <Link
                    href={p.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent"
                  >
                    <span className="truncate">{p.title}</span>
                    <span className="shrink-0 font-mono text-xs text-muted-foreground">
                      {p.price.formatted}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : result ? (
            <p className="p-3 text-sm text-muted-foreground">No results.</p>
          ) : (
            <p className="p-3 text-sm text-muted-foreground">Start typing to search.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
