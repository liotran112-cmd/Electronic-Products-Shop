import { Skeleton } from "@repo/ui";

export default function SearchLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="mx-auto mb-8 max-w-2xl">
        <Skeleton className="mb-4 h-8 w-32" />
        <Skeleton className="h-11 w-full rounded-md" />
      </div>
      <div className="grid gap-8 lg:grid-cols-[16rem,1fr]">
        <div className="hidden flex-col gap-3 lg:flex">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[3/4] w-full rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
