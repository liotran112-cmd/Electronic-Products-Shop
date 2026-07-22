import { Skeleton } from "@repo/ui";

/** Category skeleton — grid + sidebar shell to keep layout stable while loading. */
export default function CategoryLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <Skeleton className="mb-4 h-4 w-48" />
      <Skeleton className="mb-6 h-9 w-64" />
      <div className="grid gap-8 lg:grid-cols-[16rem,1fr]">
        <div className="hidden flex-col gap-3 lg:flex">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" />
          ))}
        </div>
        <div>
          <div className="mb-4 flex items-center justify-between">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-9 w-40" />
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
