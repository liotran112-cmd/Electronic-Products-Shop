import type { Specification, SpecificationGroup } from "@repo/domain";

/** Turn a snake_case attribute key into a human label. */
export function humanizeKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\bCpu\b/, "CPU")
    .replace(/\bRam\b/, "RAM");
}

/** Extract the display string from a `products.specs` projection value. */
export function specDisplay(value: unknown): string {
  if (value && typeof value === "object") {
    const v = value as { display?: string | string[] };
    if (Array.isArray(v.display)) return v.display.join(", ");
    if (typeof v.display === "string") return v.display;
  }
  return typeof value === "string" ? value : "";
}

export function toSpecifications(specs: Record<string, unknown>): Specification[] {
  return Object.entries(specs)
    .map(([key, value]) => ({ key, label: humanizeKey(key), value: specDisplay(value), isKeySpec: false }))
    .filter((s) => s.value !== "");
}

export function toKeySpecs(specs: Record<string, unknown>, limit = 4): Specification[] {
  return toSpecifications(specs)
    .slice(0, limit)
    .map((s) => ({ ...s, isKeySpec: true }));
}

/**
 * Build specification groups from the denormalized `products.specs` projection
 * (single "Specifications" group — no extra joins, DATA-MODEL §1.3). Richer
 * grouping via `attribute_definitions.display_group` is a projection-enrichment
 * follow-up.
 */
export function toSpecGroups(specs: Record<string, unknown>): SpecificationGroup[] {
  const specifications = toSpecifications(specs);
  return specifications.length ? [{ name: "Specifications", specifications }] : [];
}
