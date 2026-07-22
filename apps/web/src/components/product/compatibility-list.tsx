import { Link2 } from "lucide-react";

import { cn } from "@repo/ui";

export interface CompatibilityListProps {
  items: Array<{ label: string; href?: string }>;
  className?: string;
}

const CHIP =
  "inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-sm transition-colors";

/** "Works with" chips — products, platforms, standards. */
export function CompatibilityList({ items, className }: CompatibilityListProps) {
  if (items.length === 0) return null;
  return (
    <ul className={cn("flex flex-wrap gap-2", className)}>
      {items.map((item, i) => (
        <li key={`${item.label}-${i}`}>
          {item.href ? (
            <a
              href={item.href}
              className={cn(CHIP, "hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring")}
            >
              <Link2 className="size-3.5 text-muted-foreground" aria-hidden />
              {item.label}
            </a>
          ) : (
            <span className={CHIP}>
              <Link2 className="size-3.5 text-muted-foreground" aria-hidden />
              {item.label}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
