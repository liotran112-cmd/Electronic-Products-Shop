import Link from "next/link";

import { getNavigation } from "@repo/bff";

import { AccountMenu } from "./account-menu";
import { CartIndicator } from "./cart-indicator";
import { Logo } from "./logo";
import { MegaNav } from "./mega-nav";
import { MobileMenu } from "./mobile-menu";
import { SearchEntry } from "./search-entry";

/** Sticky, search-first header. Server Component — fetches nav via the BFF. */
export async function Header() {
  const nav = await getNavigation();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
        <MobileMenu nav={nav} />
        <Link
          href="/"
          aria-label="Ampere home"
          className="flex items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Logo />
        </Link>
        <div className="ml-2 hidden lg:block">
          <MegaNav nav={nav} />
        </div>
        <div className="ml-auto flex items-center gap-1">
          <SearchEntry />
          <AccountMenu />
          <CartIndicator />
        </div>
      </div>
    </header>
  );
}
