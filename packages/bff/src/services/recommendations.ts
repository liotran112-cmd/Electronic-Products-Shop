import { TAGS, TTL, withCache } from "@repo/cache";
import type { Recommendation, RelatedProduct } from "@repo/domain";

import { hitToSummary } from "../mappers/summary.mapper";
import * as catalog from "../repositories/catalog.repo";
import * as search from "../repositories/search.repo";

function categoryLvl1(trail: string[]): string | undefined {
  return trail.length >= 2 ? trail.slice(0, 2).join(" > ") : undefined;
}

async function relatedHits(handle: string) {
  const core = await catalog.getCatalogProduct(handle);
  if (!core) return [];
  return search.relatedHits(handle, categoryLvl1(core.categoryTrail));
}

export function getRecommendations(handle: string): Promise<Recommendation[]> {
  return withCache(
    async (h: string): Promise<Recommendation[]> => {
      const hits = await relatedHits(h);
      return hits.map((hit) => ({ product: hitToSummary(hit) }));
    },
    { keyParts: ["recommendations"], tags: [TAGS.product(handle), TAGS.recommendations()], revalidate: TTL.hour },
  )(handle);
}

export function getRelatedProducts(handle: string): Promise<RelatedProduct[]> {
  return withCache(
    async (h: string): Promise<RelatedProduct[]> => {
      const hits = await relatedHits(h);
      return hits.map((hit) => ({ product: hitToSummary(hit), relationship: "alternative" as const }));
    },
    { keyParts: ["related"], tags: [TAGS.product(handle), TAGS.recommendations()], revalidate: TTL.hour },
  )(handle);
}
