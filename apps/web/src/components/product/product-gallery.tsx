"use client";

import * as React from "react";
import Image from "next/image";
import { ImageOff } from "lucide-react";

import type { Image as ImageModel } from "@repo/domain";
import { cn } from "@repo/ui";

/**
 * Product image gallery — the one interactive leaf of the hero. Server-rendered
 * first image is the LCP element (priority). Gracefully renders a placeholder
 * when a product has no images.
 */
export function ProductGallery({ images, title }: { images: ImageModel[]; title: string }) {
  const [active, setActive] = React.useState(0);

  if (images.length === 0) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-xl border bg-secondary/40 text-muted-foreground">
        <div className="flex flex-col items-center gap-2">
          <ImageOff className="size-10" aria-hidden />
          <span className="text-sm">No image available</span>
        </div>
      </div>
    );
  }

  const current = images[Math.min(active, images.length - 1)]!;

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-square w-full overflow-hidden rounded-xl border bg-secondary/30">
        <Image
          key={current.url}
          src={current.url}
          alt={current.alt || title}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-contain"
          placeholder={current.blurDataURL ? "blur" : undefined}
          blurDataURL={current.blurDataURL}
        />
      </div>

      {images.length > 1 ? (
        <ul className="flex flex-wrap gap-2" aria-label={`${title} images`}>
          {images.map((img, i) => (
            <li key={img.url}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`View image ${i + 1}`}
                aria-current={i === active ? "true" : undefined}
                className={cn(
                  "relative size-16 overflow-hidden rounded-md border transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  i === active ? "border-primary ring-1 ring-primary" : "hover:border-primary/40",
                )}
              >
                <Image src={img.url} alt="" fill sizes="64px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
