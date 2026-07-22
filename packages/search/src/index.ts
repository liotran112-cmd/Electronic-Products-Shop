export {
  mergeProductRecord,
  toHierarchicalFacet,
  type ProductSearchRecord,
  type ShopifyFacts,
  type SpecFacts,
  type SpecProjection,
  type SpecProjectionValue,
  type EditorialFacts,
} from "./merge";

export { searchClient, adminClient } from "./client";
export { indexProducts, deleteProducts } from "./indexer";
export { applySettings, primarySettings, SYNONYMS } from "./settings";
export { INDEX } from "./constants";
