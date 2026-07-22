import type { SpecificationGroup as SpecGroup } from "@repo/domain";
import { cn } from "@repo/ui";

export function SpecificationGroup({ group }: { group: SpecGroup }) {
  return (
    <section aria-labelledby={`spec-${group.name}`}>
      <h3
        id={`spec-${group.name}`}
        className="mb-1 font-mono text-xs font-semibold uppercase tracking-wider text-primary"
      >
        {group.name}
      </h3>
      <dl className="divide-y">
        {group.specifications.map((spec) => (
          <div key={spec.key} className="grid grid-cols-2 gap-4 py-2.5 text-sm">
            <dt className="text-muted-foreground">{spec.label}</dt>
            <dd className="text-right font-mono tabular-nums text-foreground">
              {spec.unit ? `${spec.value} ${spec.unit}` : spec.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export interface SpecificationTableProps {
  groups: SpecGroup[];
  className?: string;
}

/** Grouped, mono spec sheet (Digi-Key). Returns null when empty — caller shows EmptyState. */
export function SpecificationTable({ groups, className }: SpecificationTableProps) {
  if (groups.length === 0) return null;
  return (
    <div className={cn("space-y-6", className)}>
      {groups.map((group) => (
        <SpecificationGroup key={group.name} group={group} />
      ))}
    </div>
  );
}
