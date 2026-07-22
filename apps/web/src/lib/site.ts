import { clientEnv } from "@repo/env";

/**
 * Canonical site origin for metadata/JSON-LD. Reads the validated env, but
 * degrades to localhost if env is absent (e.g. a build without secrets) so
 * static generation never fails on config — mirrors the BFF's optional-source
 * degradation. Never read `process.env` directly (CLAUDE.md).
 */
export function siteUrl(): string {
  try {
    return clientEnv().NEXT_PUBLIC_SITE_URL;
  } catch {
    return "http://localhost:3000";
  }
}

/** Absolute URL for a site-relative path (leading slash expected). */
export function absoluteUrl(path: string): string {
  return new URL(path, siteUrl()).toString();
}
