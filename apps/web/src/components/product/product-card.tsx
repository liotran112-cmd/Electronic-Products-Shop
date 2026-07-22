import Image from "next/image";
import Link from "next/link";

import type { ProductSummary } from "@repo/domain";
import { Badge, cn } from "@repo/ui";

import { PriceDisplay } from "./price-display";
import { AddToCartButton } from "./product-card-actions";
import { RatingSummary } from "./rating-summary";
import { StockIndicator } from "./stock-indicator";
import { KeySpecChips } from "./technical-badge";

/** Server Component. Whole card is a link (stretched); Add button is the only client leaf. */
export function ProductCard({ product, className }: { product: ProductSummary; className?: string }) {
  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-lg border bg-card transition-all",
        "hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md",
        className,
      )}
    >
      <div className="relative block aspect-[4/3] overflow-hidden bg-secondary/40">
        {product.badges?.[0] ? (
          <Badge className="absolute left-2 top-2 z-10">{product.badges[0]}</Badge>
        ) : null}
        {product.image ? (
          <Image
            src={product.image.url}
            alt={product.image.alt}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No image
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
          {product.brand}
        </p>
        <h3 className="text-sm font-semibold leading-snug">
          <Link
            href={product.href}
            className="after:absolute after:inset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {product.title}
          </Link>
        </h3>
        {product.rating ? <RatingSummary rating={product.rating} /> : null}
        <StockIndicator availability={product.availability} />
        <KeySpecChips specs={product.keySpecs} />

        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <PriceDisplay price={product.price} compareAtPrice={product.compareAtPrice} />
          <div className="relative z-10">
            <AddToCartButton
              line={{
                id: product.id,
                handle: product.handle,
                title: product.title,
                price: product.price.amount,
                currency: product.price.currency,
                image: product.image?.url ?? null,
              }}
            />
          </div>
        </div>
      </div>
    </article>
  );
}
