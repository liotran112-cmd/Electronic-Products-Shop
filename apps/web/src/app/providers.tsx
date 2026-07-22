"use client";

import * as React from "react";
import { MotionConfig } from "framer-motion";

import { TooltipProvider } from "@repo/ui";

import { CartProvider } from "../hooks/use-cart";

/** Client provider tree. `reducedMotion="user"` honors prefers-reduced-motion globally. */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <TooltipProvider delayDuration={200}>
        <CartProvider>{children}</CartProvider>
      </TooltipProvider>
    </MotionConfig>
  );
}
