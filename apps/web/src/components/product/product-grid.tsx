import { PackageSearch } from "lucide-react";

import type { ProductSummary } from "@repo/domain";
import { cn, EmptyState } from "@repo/ui";

import { ProductCard } from "./product-card";

export interface ProductGridProps {
  products: ProductSummary[];
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
}

/** Responsive product grid with a designed empty state (every grid has one). */
export function ProductGrid({
  products,
  emptyTitle = "No products found",
  emptyDescription = "Try adjusting your filters or search.",
  className,
}: ProductGridProps) {
  if (products.length === 0) {
    return <EmptyState icon={PackageSearch} title={emptyTitle} description={emptyDescription} />;
  }
  return (
    <div className={cn("grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4", className)}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
