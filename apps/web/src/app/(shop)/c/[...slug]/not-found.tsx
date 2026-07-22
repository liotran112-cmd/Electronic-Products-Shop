import Link from "next/link";
import { FolderX } from "lucide-react";

import { Button, EmptyState } from "@repo/ui";

export default function CategoryNotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <EmptyState
        icon={FolderX}
        title="Category not found"
        description="This category doesn't exist or may have been renamed."
        action={
          <Button asChild>
            <Link href="/search">Browse all products</Link>
          </Button>
        }
      />
    </div>
  );
}
