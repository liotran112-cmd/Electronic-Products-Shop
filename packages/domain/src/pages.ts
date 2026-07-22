import type { ProductSummary, TutorialPreview } from "./catalog";
import type { Breadcrumb, Image, RichText, Seo } from "./common";
import type { Facet, SearchResult } from "./search";

export interface CategoryTile {
  name: string;
  slug: string;
  href: string;
  image?: Image;
  productCount?: number;
}

export interface BrandTile {
  name: string;
  slug: string;
  href: string;
  logo?: Image;
}

export interface CategoryPage {
  category: { name: string; slug: string; description?: RichText };
  breadcrumbs: Breadcrumb[];
  facets: Facet[];
  initial: SearchResult;
  seo: Seo;
}

export interface BrandPage {
  brand: { name: string; slug: string; logo?: Image; description?: RichText };
  breadcrumbs: Breadcrumb[];
  featured: ProductSummary[];
  initial: SearchResult;
  seo: Seo;
}

export interface Homepage {
  hero: {
    headline: string;
    subline: string;
    image?: Image;
    cta: Array<{ label: string; href: string }>;
    specChips?: string[];
  };
  featuredCategories: CategoryTile[];
  trending: ProductSummary[];
  newArrivals: ProductSummary[];
  customSolutions: { headline: string; body: string; href: string };
  educational: TutorialPreview[];
  brands: BrandTile[];
  seo: Seo;
}

export interface NavItem {
  label: string;
  href: string;
  children?: NavItem[];
}

export interface MegaMenuColumn {
  heading: string;
  links: NavItem[];
}

export interface MegaMenuSection {
  category: NavItem;
  columns: MegaMenuColumn[];
  featured?: ProductSummary[];
}

export interface Navigation {
  primary: NavItem[];
  mega: MegaMenuSection[];
}
