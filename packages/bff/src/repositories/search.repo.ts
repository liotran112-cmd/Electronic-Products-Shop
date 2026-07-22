import { INDEX, searchClient } from "@repo/search";

/** Algolia reads — search, facets, related, trending. Returns Algolia-shaped hits. */

export interface AlgoliaHit {
  objectID: string;
  handle: string;
  url: string;
  title: string;
  vendor: string;
  image: string | null;
  price: number;
  currency: string;
  available: boolean;
  rating?: number;
  ratingCount?: number;
  [attribute: string]: unknown;
}

export interface SearchResponseShape {
  hits: AlgoliaHit[];
  facets?: Record<string, Record<string, number>>;
  nbHits: number;
  page: number;
  nbPages: number;
  hitsPerPage: number;
}

function sortIndex(sort?: string): string {
  switch (sort) {
    case "price_asc":
      return INDEX.replicas.priceAsc;
    case "price_desc":
      return INDEX.replicas.priceDesc;
    case "newest":
      return INDEX.replicas.newest;
    case "popularity":
      return INDEX.replicas.popularity;
    default:
      return INDEX.products;
  }
}

export interface SearchQuery {
  query?: string;
  facetFilters?: string[][];
  numericFilters?: string[];
  extraFilter?: string;
  page?: number;
  hitsPerPage?: number;
  sort?: string;
}

const FACETS = ["vendor", "categories.lvl0", "categories.lvl1", "available"];

export async function searchIndex(q: SearchQuery): Promise<SearchResponseShape> {
  const client = searchClient();
  const filters = ["published:true", q.extraFilter].filter(Boolean).join(" AND ");
  const res = await client.search({
    requests: [
      {
        indexName: sortIndex(q.sort),
        query: q.query ?? "",
        facetFilters: q.facetFilters,
        numericFilters: q.numericFilters,
        filters,
        facets: FACETS,
        page: q.page ?? 0,
        hitsPerPage: q.hitsPerPage ?? 24,
      },
    ],
  });
  return res.results[0] as unknown as SearchResponseShape;
}

export async function relatedHits(handle: string, categoryLvl1?: string): Promise<AlgoliaHit[]> {
  const client = searchClient();
  const filters = [
    "published:true",
    `NOT handle:${handle}`,
    categoryLvl1 ? `categories.lvl1:"${categoryLvl1}"` : undefined,
  ]
    .filter(Boolean)
    .join(" AND ");
  const res = await client.search({
    requests: [{ indexName: INDEX.products, query: "", filters, hitsPerPage: 8 }],
  });
  return (res.results[0] as unknown as SearchResponseShape).hits;
}

export async function topHits(
  sort: "popularity" | "newest",
  hitsPerPage = 12,
): Promise<AlgoliaHit[]> {
  const client = searchClient();
  const res = await client.search({
    requests: [
      {
        indexName: sort === "newest" ? INDEX.replicas.newest : INDEX.replicas.popularity,
        query: "",
        filters: "published:true",
        hitsPerPage,
      },
    ],
  });
  return (res.results[0] as unknown as SearchResponseShape).hits;
}
