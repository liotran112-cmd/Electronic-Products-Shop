import { FileText } from "lucide-react";
import type { ReactNode } from "react";

import type { ProductDetail } from "@repo/domain";
import { EmptyState } from "@repo/ui";

import { Breadcrumbs } from "../layout/breadcrumbs";
import { RichText } from "../rich-text";
import { CompatibilityList } from "./compatibility-list";
import { DocumentDownload } from "./document-download";
import { ProductGallery } from "./product-gallery";
import { ProductReviews } from "./product-reviews";
import { RatingSummary } from "./rating-summary";
import { SpecificationTable } from "./specification-table";
import { TutorialCard } from "./tutorial-card";

function SectionHeading({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h2 id={id} className="mb-4 text-lg font-semibold">
      {children}
    </h2>
  );
}

/**
 * Presentational product page body (Server Component). Takes a fully-composed
 * `ProductDetail` plus two streamed slots — `buySlot` (live pricing) and
 * `relatedSlot` — injected by the route so this stays synchronous and testable.
 */
export function ProductView({
  detail,
  buySlot,
  relatedSlot,
}: {
  detail: ProductDetail;
  buySlot: ReactNode;
  relatedSlot: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <Breadcrumbs items={detail.breadcrumbs} className="mb-6" />

      {/* Hero: gallery + purchase */}
      <div className="grid gap-8 lg:grid-cols-2">
        <ProductGallery images={detail.gallery} title={detail.title} />

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <p className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
              {detail.brand.name}
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
              {detail.title}
            </h1>
            {detail.subtitle ? (
              <p className="text-pretty text-muted-foreground">{detail.subtitle}</p>
            ) : null}
          </div>

          {detail.reviews.count > 0 ? (
            <a href="#reviews" className="w-fit rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <RatingSummary rating={detail.reviews} />
            </a>
          ) : null}

          {buySlot}

          {detail.keyBenefits.length > 0 ? (
            <ul className="flex flex-col gap-2 text-sm">
              {detail.keyBenefits.map((benefit, i) => (
                <li key={i} className="flex gap-2">
                  <span aria-hidden className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                  <span className="text-muted-foreground">{benefit}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>

      {/* Detail sections */}
      <div className="mt-14 grid gap-12 lg:grid-cols-3">
        <div className="space-y-12 lg:col-span-2">
          {detail.description ? (
            <section aria-labelledby="overview-heading">
              <SectionHeading id="overview-heading">Overview</SectionHeading>
              <RichText value={detail.description} />
            </section>
          ) : null}

          <section aria-labelledby="specs-heading">
            <SectionHeading id="specs-heading">Technical specifications</SectionHeading>
            {detail.specificationGroups.length > 0 ? (
              <SpecificationTable groups={detail.specificationGroups} />
            ) : (
              <EmptyState
                title="Specifications coming soon"
                description="Detailed specs for this product haven't been published yet."
              />
            )}
          </section>

          {detail.compatibility.length > 0 ? (
            <section aria-labelledby="compat-heading">
              <SectionHeading id="compat-heading">Works with</SectionHeading>
              <CompatibilityList items={detail.compatibility} />
            </section>
          ) : null}

          <section aria-labelledby="reviews-heading" id="reviews" className="scroll-mt-20">
            <SectionHeading id="reviews-heading">Reviews</SectionHeading>
            <ProductReviews reviews={detail.reviews} />
          </section>
        </div>

        <aside className="space-y-10">
          <section aria-labelledby="docs-heading">
            <SectionHeading id="docs-heading">Documentation</SectionHeading>
            {detail.documents.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {detail.documents.map((doc) => (
                  <li key={doc.id}>
                    <DocumentDownload document={doc} />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={FileText}
                title="No documents yet"
                description="Datasheets and manuals will appear here when available."
              />
            )}
          </section>

          {detail.tutorials.length > 0 ? (
            <section aria-labelledby="learn-heading">
              <SectionHeading id="learn-heading">Learn</SectionHeading>
              <div className="flex flex-col gap-3">
                {detail.tutorials.map((tutorial) => (
                  <TutorialCard key={tutorial.slug} tutorial={tutorial} />
                ))}
              </div>
            </section>
          ) : null}
        </aside>
      </div>

      {relatedSlot}
    </div>
  );
}
