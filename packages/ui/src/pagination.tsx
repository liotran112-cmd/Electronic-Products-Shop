import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "./cn";

export interface PaginationProps {
  page: number;
  totalPages: number;
  hrefFor: (page: number) => string;
  className?: string;
}

/** Accessible page navigation. `hrefFor` keeps it a real link list (crawlable, no JS needed). */
export function Pagination({ page, totalPages, hrefFor, className }: PaginationProps) {
  if (totalPages <= 1) return null;
  const pages = pageWindow(page, totalPages);

  return (
    <nav aria-label="Pagination" className={cn("flex items-center justify-center gap-1", className)}>
      <PageLink href={hrefFor(page - 1)} disabled={page <= 1} label="Previous page">
        <ChevronLeft className="size-4" aria-hidden />
      </PageLink>
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`gap-${i}`} className="px-2 text-sm text-muted-foreground" aria-hidden>
            …
          </span>
        ) : (
          <a
            key={p}
            href={hrefFor(p)}
            aria-current={p === page ? "page" : undefined}
            className={cn(
              "inline-flex h-9 min-w-9 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              p === page ? "bg-primary text-primary-foreground" : "hover:bg-accent hover:text-accent-foreground",
            )}
          >
            {p}
          </a>
        ),
      )}
      <PageLink href={hrefFor(page + 1)} disabled={page >= totalPages} label="Next page">
        <ChevronRight className="size-4" aria-hidden />
      </PageLink>
    </nav>
  );
}

function PageLink({
  href,
  disabled,
  label,
  children,
}: {
  href: string;
  disabled: boolean;
  label: string;
  children: React.ReactNode;
}) {
  const cls =
    "inline-flex h-9 w-9 items-center justify-center rounded-md text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
  if (disabled) {
    return (
      <span aria-disabled className={cn(cls, "pointer-events-none opacity-40")} aria-label={label}>
        {children}
      </span>
    );
  }
  return (
    <a href={href} className={cn(cls, "hover:bg-accent hover:text-accent-foreground")} aria-label={label}>
      {children}
    </a>
  );
}

function pageWindow(page: number, total: number): Array<number | "…"> {
  const out: Array<number | "…"> = [];
  const add = (n: number) => out.push(n);
  add(1);
  const start = Math.max(2, page - 1);
  const end = Math.min(total - 1, page + 1);
  if (start > 2) out.push("…");
  for (let i = start; i <= end; i++) add(i);
  if (end < total - 1) out.push("…");
  if (total > 1) add(total);
  return out;
}
