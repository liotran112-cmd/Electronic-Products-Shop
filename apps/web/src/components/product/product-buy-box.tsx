"use client";

import * as React from "react";
import { Check, Loader2, Minus, Plus, ShoppingCart } from "lucide-react";

import type { LivePricing, Money, ProductDetail } from "@repo/domain";
import { Button, cn } from "@repo/ui";

import { useCart } from "../../hooks/use-cart";
import { PriceDisplay } from "./price-display";
import { StockIndicator } from "./stock-indicator";

interface BuyState {
  price: Money;
  compareAtPrice?: Money;
  availability: ProductDetail["availability"];
  quantityAvailable?: number;
}

/** Resolve the effective price/stock for a variant: authoritative live data wins,
 *  snapshot is the fallback so the box is fully rendered before live streams in. */
function resolve(detail: ProductDetail, variantId: string, live?: LivePricing): BuyState {
  const variant = detail.variants.find((v) => v.id === variantId);
  const liveVariant = live?.variants.find((v) => v.id === variantId);
  return {
    price: liveVariant?.price ?? variant?.price ?? detail.price,
    compareAtPrice: liveVariant?.compareAtPrice ?? variant?.compareAtPrice ?? detail.compareAtPrice,
    availability: liveVariant?.availability ?? variant?.availability ?? detail.availability,
    quantityAvailable: liveVariant?.quantityAvailable,
  };
}

/**
 * Purchase panel (client leaf). Variant + quantity selection and add-to-cart via
 * the shared `useCart` seam — no bespoke commerce logic. Renders identically with
 * or without `live`, so it doubles as its own Suspense fallback (zero CLS).
 */
export function ProductBuyBox({ detail, live }: { detail: ProductDetail; live?: LivePricing }) {
  const { add } = useCart();
  const hasVariants = detail.variants.length > 1;
  const firstId = detail.variants[0]?.id ?? detail.id;

  const [variantId, setVariantId] = React.useState(firstId);
  const [quantity, setQuantity] = React.useState(1);
  const [justAdded, setJustAdded] = React.useState(false);

  const state = resolve(detail, variantId, live);
  const soldOut = state.availability === "out_of_stock";
  const variant = detail.variants.find((v) => v.id === variantId);

  const onAdd = () => {
    add(
      {
        id: variantId,
        handle: detail.handle,
        title: hasVariants && variant ? `${detail.title} — ${variant.title}` : detail.title,
        price: state.price.amount,
        currency: state.price.currency,
        image: detail.gallery[0]?.url ?? null,
      },
      quantity,
    );
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 2000);
  };

  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-card p-5">
      <div className="flex flex-col gap-1">
        <PriceDisplay price={state.price} compareAtPrice={state.compareAtPrice} size="lg" />
        <StockIndicator availability={state.availability} count={state.quantityAvailable} />
      </div>

      {hasVariants ? (
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium">Configuration</legend>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Variant">
            {detail.variants.map((v) => {
              const selected = v.id === variantId;
              return (
                <button
                  key={v.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={v.availability === "out_of_stock"}
                  onClick={() => setVariantId(v.id)}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-sm transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    "disabled:cursor-not-allowed disabled:opacity-40",
                    selected ? "border-primary bg-accent text-accent-foreground" : "hover:border-primary/40",
                  )}
                >
                  {v.title}
                </button>
              );
            })}
          </div>
        </fieldset>
      ) : null}

      <div className="flex items-center gap-3">
        <div className="flex items-center rounded-lg border" role="group" aria-label="Quantity">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
            aria-label="Decrease quantity"
            className="flex size-10 items-center justify-center rounded-l-lg text-muted-foreground transition-colors hover:bg-accent disabled:opacity-40"
          >
            <Minus className="size-4" aria-hidden />
          </button>
          <span aria-live="polite" className="w-10 text-center font-mono text-sm tabular-nums">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity((q) => q + 1)}
            aria-label="Increase quantity"
            className="flex size-10 items-center justify-center rounded-r-lg text-muted-foreground transition-colors hover:bg-accent"
          >
            <Plus className="size-4" aria-hidden />
          </button>
        </div>

        <Button
          size="lg"
          className="flex-1"
          disabled={soldOut}
          onClick={onAdd}
          aria-label={soldOut ? `${detail.title} is out of stock` : `Add ${detail.title} to cart`}
        >
          {justAdded ? <Check aria-hidden /> : <ShoppingCart aria-hidden />}
          {soldOut ? "Out of stock" : justAdded ? "Added to cart" : "Add to cart"}
        </Button>
      </div>

      {detail.isCustom ? (
        <Button asChild variant="outline" size="lg">
          <a href={`/quote?product=${detail.handle}`}>Request a custom quote</a>
        </Button>
      ) : null}

      {live ? null : (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Loader2 className="size-3 animate-spin" aria-hidden />
          Confirming live availability…
        </p>
      )}
    </div>
  );
}
