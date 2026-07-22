import type { Specification } from "@repo/domain";
import { cn } from "@repo/ui";

export interface TechnicalBadgeProps {
  label?: string;
  value: string;
  className?: string;
}

/** Compact mono spec chip (Digi-Key signal). */
export function TechnicalBadge({ label, value, className }: TechnicalBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border bg-secondary px-2 py-0.5 font-mono text-xs text-secondary-foreground",
        className,
      )}
    >
      {label ? <span className="text-muted-foreground">{label}</span> : null}
      {value}
    </span>
  );
}

/** Render a product's key specs as a chip row. */
export function KeySpecChips({ specs, className }: { specs: Specification[]; className?: string }) {
  if (specs.length === 0) return null;
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {specs.map((s) => (
        <TechnicalBadge key={s.key} value={s.unit ? `${s.value} ${s.unit}` : s.value} />
      ))}
    </div>
  );
}
