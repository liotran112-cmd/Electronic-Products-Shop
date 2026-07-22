import Link from "next/link";

import { Button } from "@repo/ui";

const sources = [
  { name: "Shopify", owns: "commerce · checkout · orders" },
  { name: "Sanity", owns: "editorial · docs · tutorials" },
  { name: "Supabase", owns: "specs · firmware · quotes · auth" },
  { name: "Algolia", owns: "search · faceted filtering (derived)" },
];

export default function HomePage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <p className="font-mono text-sm text-primary">Phase 1 · Foundation</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight text-balance">
        Electronics Commerce Platform
      </h1>
      <p className="mt-4 text-lg text-muted-foreground text-pretty">
        Monorepo shell is live. Each data domain has exactly one source of truth; the storefront
        composes them.
      </p>

      <ul className="mt-10 grid gap-3 sm:grid-cols-2">
        {sources.map((s) => (
          <li key={s.name} className="rounded-lg border bg-card p-4">
            <p className="font-semibold text-card-foreground">{s.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">{s.owns}</p>
          </li>
        ))}
      </ul>

      <div className="mt-10 flex gap-3">
        <Button asChild>
          <Link href="/search">Browse catalog</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/quote">Request a quote</Link>
        </Button>
      </div>
    </div>
  );
}
