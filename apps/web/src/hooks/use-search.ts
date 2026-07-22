"use client";

import * as React from "react";

import type { SearchParams, SearchResult } from "@repo/domain";

import { searchAction } from "../actions/catalog";

/**
 * Client search hook — consumes the BFF via `searchAction` (never Algolia
 * directly). Returns the latest result + a debounced `query` runner.
 */
export function useSearch(initial?: SearchResult) {
  const [result, setResult] = React.useState<SearchResult | null>(initial ?? null);
  const [isPending, startTransition] = React.useTransition();
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const run = React.useCallback((params: SearchParams) => {
    startTransition(async () => {
      setResult(await searchAction(params));
    });
  }, []);

  const query = React.useCallback(
    (params: SearchParams, debounceMs = 250) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => run(params), debounceMs);
    },
    [run],
  );

  React.useEffect(() => () => timer.current && clearTimeout(timer.current), []);

  return { result, loading: isPending, run, query };
}
