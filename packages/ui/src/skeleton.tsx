import * as React from "react";

import { cn } from "./cn";

/** Loading placeholder. Match the final element's box to avoid layout shift. */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} {...props} />;
}
