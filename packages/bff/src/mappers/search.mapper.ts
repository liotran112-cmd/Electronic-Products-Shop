import type { AppliedFilter, Facet, SearchParams, SearchResult, SortOption } from "@repo/domain";

import type { SearchResponseShape } from "../repositories/search.repo";
import { humanizeKey } from "./specs.mapper";
import { hitToSummary } from "./summary.mapper";

const FACET_LABELS: Record<string, string> = {
  vendor: "Brand",
  "categories.lvl0": "Category",
  "categories.lvl1": "Category",
  available: "Availability",
};

function facetLabel(attribute: string): string {
  return FACET_LABELS[attribute] ?? humanizeKey(attribute.replace(/^spec_/, ""));
}

function toFacets(
  facets: SearchResponseShape["facets"],
  params: SearchParams,
): Facet[] {
  if (!facets) return [];
  return Object.entries(facets).map(([attribute, values]) => {
    const selected = new Set(params.filters?.[attribute] ?? []);
    return {
      attribute,
      label: facetLabel(attribute),
      type: attribute.startsWith("categories.") ? "hierarchical" : "list",
      values: Object.entries(values)
        .map(([value, count]) => ({ value, label: value, count, selected: selected.has(value) }))
        .sort((a, b) => b.count - a.count),
    };
  });
}

function toApplied(params: SearchParams): AppliedFilter[] {
  const applied: AppliedFilter[] = [];
  for (const [attribute, values] of Object.entries(params.filters ?? {})) {
    for (const value of values) {
      applied.push({ attribute, label: facetLabel(attribute), value });
    }
  }
  return applied;
}

export function toSearchResult(res: SearchResponseShape, params: SearchParams): SearchResult {
  const pageSize = res.hitsPerPage || params.pageSize || 24;
  const page = res.page + 1;
  return {
    query: params.query,
    items: res.hits.map(hitToSummary),
    facets: toFacets(res.facets, params),
    appliedFilters: toApplied(params),
    pagination: {
      page,
      pageSize,
      total: res.nbHits,
      totalPages: res.nbPages,
      hasNext: page < res.nbPages,
      hasPrev: page > 1,
    },
    sort: (params.sort as SortOption) ?? "relevance",
  };
}
