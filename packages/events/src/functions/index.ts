import { quoteCreated } from "./quote-created";
import { reindexProduct } from "./reindex-product";

/** All Inngest functions, served together from apps/web/api/inngest. */
export const functions = [reindexProduct, quoteCreated];

export { reindexProduct, quoteCreated };
