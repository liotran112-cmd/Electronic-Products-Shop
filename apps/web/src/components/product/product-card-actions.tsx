"use client";

import { Check, ShoppingCart } from "lucide-react";

import { Button } from "@repo/ui";

import { useCart, type CartLine } from "../../hooks/use-cart";

/** The single client leaf inside ProductCard — keeps the card itself a Server Component. */
export function AddToCartButton({ line }: { line: Omit<CartLine, "quantity"> }) {
  const { add, lines } = useCart();
  const inCart = lines.some((l) => l.id === line.id);
  return (
    <Button
      size="sm"
      variant={inCart ? "secondary" : "default"}
      onClick={() => add(line)}
      aria-label={inCart ? `${line.title} added to cart` : `Add ${line.title} to cart`}
    >
      {inCart ? <Check aria-hidden /> : <ShoppingCart aria-hidden />}
      {inCart ? "Added" : "Add"}
    </Button>
  );
}
