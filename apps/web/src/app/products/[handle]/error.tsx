"use client";

import { useEffect } from "react";

import { Button, ErrorState } from "@repo/ui";

/**
 * PDP error boundary. Triggered when a REQUIRED source fails (not for
 * not-found — that renders not-found.tsx). Offers recovery via reset().
 */
export default function ProductError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Client-side surface; server already reported to Sentry via @repo/core.
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <ErrorState
        title="We couldn't load this product"
        description="Something went wrong reaching our catalog. Please try again in a moment."
        action={<Button onClick={reset}>Try again</Button>}
      />
    </div>
  );
}
