"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

import type { Navigation } from "@repo/domain";
import { cn } from "@repo/ui";

const NAV_LINK =
  "inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/** Desktop primary nav with a hover/focus mega panel (categories). */
export function MegaNav({ nav }: { nav: Navigation }) {
  const [open, setOpen] = React.useState(false);

  return (
    <nav aria-label="Primary" className="flex items-center gap-1">
      {nav.mega.length > 0 ? (
        <div
          className="relative"
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
        >
          <button
            type="button"
            className={NAV_LINK}
            aria-expanded={open}
            onFocus={() => setOpen(true)}
            onClick={() => setOpen((v) => !v)}
          >
            Shop
            <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} aria-hidden />
          </button>
          <AnimatePresence>
            {open ? (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
                className="absolute left-0 top-full z-50 mt-2 w-[36rem] rounded-lg border bg-popover p-3 shadow-lg"
              >
                <ul className="grid grid-cols-2 gap-1">
                  {nav.mega.map((section) => (
                    <li key={section.category.href}>
                      <Link
                        href={section.category.href}
                        className="block rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                        onClick={() => setOpen(false)}
                      >
                        {section.category.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      ) : null}

      {nav.primary.map((item) => (
        <Link key={item.href} href={item.href} className={NAV_LINK}>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
