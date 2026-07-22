import type { SearchParams, SearchResult } from "@repo/domain";

import { toSearchResult } from "../mappers/search.mapper";
import * as search from "../repositories/search.repo";

function toAlgoliaQuery(params: SearchParams): search.SearchQuery {
  const facetFilters: string[][] = [];
  if (params.brand) facetFilters.push([`vendor:${params.brand}`]);
  if (params.category) facetFilters.push([`categories.lvl0:${params.category}`]);
  for (const [attr, values] of Object.entries(params.filters ?? {})) {
    if (values.length) facetFilters.push(values.map((v) => `${attr}:${v}`));
  }
  const numericFilters: string[] = [];
  for (const [attr, [min, max]] of Object.entries(params.range ?? {})) {
    numericFilters.push(`${attr}>=${min}`, `${attr}<=${max}`);
  }
  return {
    query: params.query,
    facetFilters: facetFilters.length ? facetFilters : undefined,
    numericFilters: numericFilters.length ? numericFilters : undefined,
    page: (params.page ?? 1) - 1,
    hitsPerPage: params.pageSize ?? 24,
    sort: params.sort,
  };
}

/** Dynamic — Algolia IS the cache. No server cache layer (SEARCH §7). */
export async function searchProducts(params: SearchParams): Promise<SearchResult> {
  const response = await search.searchIndex(toAlgoliaQuery(params));
  return toSearchResult(response, params);
}
