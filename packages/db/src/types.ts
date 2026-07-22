/**
 * Placeholder for the Supabase-generated database types.
 *
 * Run `pnpm --filter @repo/db gen:types` (with a local Supabase running) to
 * overwrite `types.gen.ts` with the real schema types, then re-export the
 * `Database` type from here. Until then this keeps the client generically typed
 * so the workspace compiles without a live database.
 */
export type Database = Record<string, unknown>;

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];
