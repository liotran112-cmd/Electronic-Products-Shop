import { sanity } from "@repo/sanity";

/** Sanity reads — editorial. Returns Sanity-shaped docs (or null). */

export interface HomepageDoc {
  hero?: {
    headline?: string;
    subline?: string;
    imageUrl?: string;
    ctas?: Array<{ label: string; href: string }>;
    specChips?: string[];
  };
  customSolutions?: { headline?: string; body?: string; href?: string };
}

export interface TutorialDoc {
  title: string;
  slug: string;
  excerpt?: string;
  level?: string;
  coverUrl?: string;
}

export interface ProductEditorialDoc {
  description?: unknown[];
  keyBenefits?: string[];
  galleryUrls?: string[];
  tutorials?: TutorialDoc[];
  manuals?: Array<{ title: string; url: string; version?: string }>;
}

export interface NavigationDoc {
  primary?: Array<{ label: string; href: string }>;
}

export function getHomepageDoc(): Promise<HomepageDoc | null> {
  return sanity.fetch<HomepageDoc | null>(
    `*[_type == "homepage"][0]{ hero, customSolutions }`,
  );
}

export function getProductEditorial(handle: string): Promise<ProductEditorialDoc | null> {
  return sanity.fetch<ProductEditorialDoc | null>(
    `*[_type == "product" && productHandle == $h][0]{
      description, keyBenefits, galleryUrls, tutorials, manuals
    }`,
    { h: handle },
  );
}

export function getEducational(limit: number): Promise<TutorialDoc[]> {
  return sanity.fetch<TutorialDoc[]>(
    `*[_type == "tutorial"] | order(publishedAt desc)[0...$n]{ title, slug, excerpt, level, coverUrl }`,
    { n: limit },
  );
}

export function getNavigationDoc(): Promise<NavigationDoc | null> {
  return sanity.fetch<NavigationDoc | null>(`*[_type == "navigation"][0]{ primary }`);
}
