import { createLogger } from "@repo/core";

const log = createLogger({ layer: "bff" });

/**
 * Run an OPTIONAL source call: on rejection, log and fall back to `fallback` so
 * the page still renders (graceful degradation, §9). Enhancements (Sanity
 * editorial, Algolia recs) use this — their failure degrades a section, never
 * the page.
 */
export async function optional<T>(promise: Promise<T>, fallback: T, context: string): Promise<T> {
  try {
    return await promise;
  } catch (error) {
    log.warn("optional source degraded", {
      context,
      error: error instanceof Error ? error.message : String(error),
    });
    return fallback;
  }
}
