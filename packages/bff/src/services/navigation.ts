import { TAGS, TTL, withCache } from "@repo/cache";
import type { Navigation } from "@repo/domain";

import * as catalog from "../repositories/catalog.repo";
import * as content from "../repositories/content.repo";
import { optional } from "../support/settle";

const DEFAULT_PRIMARY = [
  { label: "Shop", href: "/search" },
  { label: "Learn", href: "/learn" },
  { label: "Brands", href: "/brands" },
  { label: "Solutions", href: "/custom" },
];

async function build(): Promise<Navigation> {
  const [categories, doc] = await Promise.all([
    optional(catalog.listRootCategories(), [], "nav.categories"),
    optional(content.getNavigationDoc(), null, "nav.doc"),
  ]);

  return {
    primary: doc?.primary ?? DEFAULT_PRIMARY,
    mega: categories.map((c) => ({
      category: { label: c.name, href: `/c/${c.slug}` },
      columns: [],
    })),
  };
}

export function getNavigation(): Promise<Navigation> {
  return withCache(build, {
    keyParts: ["navigation"],
    tags: [TAGS.navigation(), TAGS.content()],
    revalidate: TTL.hour,
  })();
}
