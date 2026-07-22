import Image from "next/image";
import Link from "next/link";
import { GraduationCap } from "lucide-react";

import type { TutorialPreview } from "@repo/domain";
import { Badge, cn } from "@repo/ui";

/** Adafruit-style learn card. */
export function TutorialCard({ tutorial, className }: { tutorial: TutorialPreview; className?: string }) {
  return (
    <Link
      href={tutorial.href}
      className={cn(
        "group flex flex-col overflow-hidden rounded-lg border bg-card transition-all",
        "hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      <div className="relative aspect-[16/9] bg-secondary/40">
        {tutorial.coverImage ? (
          <Image
            src={tutorial.coverImage.url}
            alt={tutorial.coverImage.alt}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <GraduationCap className="size-8 text-muted-foreground" aria-hidden />
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1.5 p-4">
        {tutorial.level ? (
          <Badge variant="secondary" className="w-fit capitalize">
            {tutorial.level}
          </Badge>
        ) : null}
        <h3 className="text-sm font-semibold leading-snug">{tutorial.title}</h3>
        {tutorial.excerpt ? (
          <p className="line-clamp-2 text-sm text-muted-foreground">{tutorial.excerpt}</p>
        ) : null}
      </div>
    </Link>
  );
}
