import type { Algoliasearch } from "algoliasearch";

import { INDEX } from "./constants";

/**
 * Algolia settings-as-code (SEARCH §3–5). Lives in the repo — never hand-edited
 * in the dashboard — so it is reviewable and environment-consistent. Applied by
 * CI / an ops task via `applySettings()`.
 */

/** Synonyms that resolve the example queries (SEARCH §5). */
export const SYNONYMS = [
  { objectID: "syn-wireless", type: "synonym", synonyms: ["wireless", "wifi", "wi-fi", "802.11"] },
  { objectID: "syn-bt", type: "onewaysynonym", input: "bluetooth", synonyms: ["bt", "ble"] },
  { objectID: "syn-temp", type: "onewaysynonym", input: "temperature", synonyms: ["temp"] },
  { objectID: "syn-esp32", type: "synonym", synonyms: ["esp32", "esp-32", "esp 32"] },
  { objectID: "syn-cam", type: "synonym", synonyms: ["camera", "cam"] },
  { objectID: "syn-mcu", type: "synonym", synonyms: ["microcontroller", "mcu"] },
] satisfies Array<{ objectID: string; type: string; synonyms: string[]; input?: string }>;

/**
 * Primary-index settings. `facetKeys` are the `spec_*` attributes to make
 * filterable — generated from `attribute_definitions where is_filterable` so a
 * new filterable spec needs no code change.
 */
export function primarySettings(facetKeys: string[]) {
  return {
    searchableAttributes: [
      "title",
      "unordered(vendor)",
      "unordered(mpn,sku)", // exact part-number hits rank high
      "specsText",
      "categories.lvl0",
      "categories.lvl1",
      "unordered(keywords)",
    ],
    attributesForFaceting: [
      "searchable(vendor)",
      "searchable(categories.lvl0)",
      "searchable(categories.lvl1)",
      "available",
      "rating",
      "filterOnly(published)", // security filter, never displayed
      ...facetKeys,
    ],
    customRanking: ["desc(inStockRank)", "desc(popularity)", "desc(ratingCount)", "desc(rating)"],
    // The numeric-token exception is non-negotiable for electronics: never fuzz
    // "5V", MPNs or "4.7uF" (SEARCH §5).
    typoTolerance: true,
    minWordSizefor1Typo: 4,
    minWordSizefor2Typos: 8,
    allowTyposOnNumericTokens: false,
    ignorePlurals: true,
    // Virtual replicas keep relevance while sorting (SEARCH §1/§5).
    replicas: [
      `virtual(${INDEX.replicas.priceAsc})`,
      `virtual(${INDEX.replicas.priceDesc})`,
      `virtual(${INDEX.replicas.newest})`,
      `virtual(${INDEX.replicas.popularity})`,
    ],
  };
}

/** Per-replica sort settings (relevanceStrictness keeps some relevance in sorts). */
const REPLICA_SETTINGS: Record<string, { customRanking: string[]; relevanceStrictness: number }> = {
  [INDEX.replicas.priceAsc]: { customRanking: ["asc(price)"], relevanceStrictness: 60 },
  [INDEX.replicas.priceDesc]: { customRanking: ["desc(price)"], relevanceStrictness: 60 },
  [INDEX.replicas.newest]: { customRanking: ["desc(popularity)"], relevanceStrictness: 75 },
  [INDEX.replicas.popularity]: { customRanking: ["desc(popularity)"], relevanceStrictness: 75 },
};

/** Push settings, replicas and synonyms to Algolia. SERVER-ONLY (admin key). */
export async function applySettings(admin: Algoliasearch, facetKeys: string[]): Promise<void> {
  await admin.setSettings({
    indexName: INDEX.products,
    indexSettings: primarySettings(facetKeys),
  });

  for (const [indexName, indexSettings] of Object.entries(REPLICA_SETTINGS)) {
    await admin.setSettings({ indexName, indexSettings });
  }

  await admin.saveSynonyms({
    indexName: INDEX.products,
    synonymHit: SYNONYMS as Parameters<typeof admin.saveSynonyms>[0]["synonymHit"],
    replaceExistingSynonyms: true,
    forwardToReplicas: true,
  });
}
