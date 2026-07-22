import type { ProductDetail } from "@repo/domain";
import { cn } from "@repo/ui";

/**
 * Compare specs across products. Sticky first column, horizontal scroll, and
 * differing rows highlighted (Digi-Key/B&H comparison). Wide content scrolls in
 * its own container so the page body never scrolls sideways.
 */
export function ComparisonTable({ products, className }: { products: ProductDetail[]; className?: string }) {
  const specMaps = products.map((p) => {
    const map = new Map<string, string>();
    for (const group of p.specificationGroups) {
      for (const s of group.specifications) {
        map.set(s.label, s.unit ? `${s.value} ${s.unit}` : s.value);
      }
    }
    return map;
  });
  const labels = [...new Set(specMaps.flatMap((m) => [...m.keys()]))];

  return (
    <div className={cn("overflow-x-auto rounded-lg border", className)}>
      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">Product specification comparison</caption>
        <thead>
          <tr>
            <th scope="col" className="sticky left-0 z-10 bg-background p-3 text-left" />
            {products.map((p) => (
              <th scope="col" key={p.id} className="min-w-40 p-3 text-left align-bottom">
                <span className="block font-semibold">{p.title}</span>
                <span className="block font-mono text-xs text-muted-foreground">{p.price.formatted}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {labels.map((label) => {
            const values = specMaps.map((m) => m.get(label) ?? "—");
            const differ = new Set(values).size > 1;
            return (
              <tr key={label} className={cn("border-t", differ && "bg-accent/40")}>
                <th scope="row" className="sticky left-0 z-10 bg-inherit p-3 text-left font-medium text-muted-foreground">
                  {label}
                </th>
                {values.map((v, i) => (
                  <td key={i} className="p-3 font-mono tabular-nums">
                    {v}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
