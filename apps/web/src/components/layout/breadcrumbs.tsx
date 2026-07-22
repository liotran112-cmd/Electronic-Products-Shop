import Link from "next/link";
import { ChevronRight } from "lucide-react";

import type { Breadcrumb } from "@repo/domain";
import { cn } from "@repo/ui";

/** Accessible breadcrumb trail. Last crumb is the current page (not a link). */
export function Breadcrumbs({ items, className }: { items: Breadcrumb[]; className?: string }) {
  if (items.length === 0) return null;
  return (
    <nav aria-label="Breadcrumb" className={cn("min-w-0", className)}>
      <ol className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        {items.map((crumb, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={`${crumb.href}-${i}`} className="flex items-center gap-1">
              {isLast ? (
                <span aria-current="page" className="truncate font-medium text-foreground">
                  {crumb.name}
                </span>
              ) : (
                <>
                  <Link
                    href={crumb.href}
                    className="rounded transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {crumb.name}
                  </Link>
                  <ChevronRight className="size-3.5 shrink-0" aria-hidden />
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
