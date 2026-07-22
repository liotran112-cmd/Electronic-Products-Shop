import type { ProductSummary } from "./catalog";

export interface FacetValue {
  value: string;
  label: string;
  count: number;
  selected: boolean;
  min?: number;
  max?: number;
}

export interface Facet {
  attribute: string;
  label: string;
  type: "list" | "range" | "hierarchical";
  values: FacetValue[];
}

export interface AppliedFilter {
  attribute: string;
  label: string;
  value: string;
}

export type SortOption = "relevance" | "price_asc" | "price_desc" | "newest" | "popularity";

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface SearchResult {
  query?: string;
  items: ProductSummary[];
  facets: Facet[];
  appliedFilters: AppliedFilter[];
  pagination: Pagination;
  sort: SortOption;
}

export interface Recommendation {
  product: ProductSummary;
  reason?: string;
}

export interface RelatedProduct {
  product: ProductSummary;
  relationship: "accessory" | "alternative" | "compatible" | "frequently_bought";
}

/** Input for search / listing services. */
export interface SearchParams {
  query?: string;
  category?: string;
  brand?: string;
  filters?: Record<string, string[]>;
  range?: Record<string, [number, number]>;
  sort?: SortOption;
  page?: number;
  pageSize?: number;
}
