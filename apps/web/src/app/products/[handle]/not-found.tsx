import Link from "next/link";
import { PackageX } from "lucide-react";

import { Button, EmptyState } from "@repo/ui";

/** Rendered for deleted/archived/draft/unknown products (notFound() → 404). */
export default function ProductNotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <EmptyState
        icon={PackageX}
        title="Product not found"
        description="This product may have been discontinued or moved. Let's find you something else."
        action={
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link href="/search">Search the catalog</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/">Back to home</Link>
            </Button>
          </div>
        }
      />
    </div>
  );
}
