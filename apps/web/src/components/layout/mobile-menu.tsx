"use client";

import Link from "next/link";
import { Menu } from "lucide-react";

import type { Navigation } from "@repo/domain";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@repo/ui";

/** Mobile-first navigation drawer (Radix Sheet → focus trap + ESC + a11y). */
export function MobileMenu({ nav }: { nav: Navigation }) {
  return (
    <Sheet>
      <SheetTrigger
        className="flex size-10 items-center justify-center rounded-md text-foreground/80 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="size-5" aria-hidden />
      </SheetTrigger>
      <SheetContent side="left" className="w-80 p-0">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        <nav aria-label="Mobile" className="flex flex-col gap-1 px-4 pb-6">
          {nav.primary.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2.5 text-base font-medium transition-colors hover:bg-accent"
            >
              {item.label}
            </Link>
          ))}
          {nav.mega.length > 0 ? (
            <div className="mt-3 border-t pt-3">
              <p className="px-3 pb-1 font-mono text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Shop
              </p>
              {nav.mega.map((section) => (
                <Link
                  key={section.category.href}
                  href={section.category.href}
                  className="block rounded-md px-3 py-2.5 text-sm transition-colors hover:bg-accent"
                >
                  {section.category.label}
                </Link>
              ))}
            </div>
          ) : null}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
