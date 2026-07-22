"use client";

import { useEffect } from "react";

import { Button, ErrorState } from "@repo/ui";

export default function CategoryError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <ErrorState
        title="We couldn't load this category"
        description="Something went wrong while fetching products. Please try again."
        action={<Button onClick={reset}>Try again</Button>}
      />
    </div>
  );
}
