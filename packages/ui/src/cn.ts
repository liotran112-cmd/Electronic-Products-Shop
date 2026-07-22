import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge class names with Tailwind conflict resolution.
 * `cn("px-2", condition && "px-4")` → "px-4" (later wins, no duplicate padding).
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
