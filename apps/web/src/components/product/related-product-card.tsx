import Image from "next/image";
import Link from "next/link";

import type { RelatedProduct } from "@repo/domain";
import { Badge, cn } from "@repo/ui";

import { PriceDisplay } from "./price-display";

const RELATIONSHIP: Record<RelatedProduct["relationship"], string> = {
  accessory: "Accessory",
  alternative: "Alternative",
  compatible: "Compatible",
  frequently_bought: "Often bought together",
};

export function RelatedProductCard({ related, className }: { related: RelatedProduct; className?: string }) {
  const p = related.product;
  return (
    <Link
      href={p.href}
      className={cn(
        "group flex gap-3 rounded-lg border p-3 transition-colors hover:border-primary/30",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      <div className="relative size-16 shrink-0 overflow-hidden rounded-md bg-secondary/40">
        {p.image ? (
          <Image src={p.image.url} alt={p.image.alt} fill sizes="64px" className="object-cover" />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <Badge variant="muted" className="mb-1">
          {RELATIONSHIP[related.relationship]}
        </Badge>
        <p className="truncate text-sm font-medium">{p.title}</p>
        <PriceDisplay price={p.price} size="sm" className="mt-0.5" />
      </div>
    </Link>
  );
}
