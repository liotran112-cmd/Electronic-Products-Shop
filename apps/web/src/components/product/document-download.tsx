import { Box, Download, FileCode, FileText, FileType2, ShieldCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { DocumentDownload as DocumentModel } from "@repo/domain";
import { cn } from "@repo/ui";

const ICON: Record<DocumentModel["type"], LucideIcon> = {
  manual: FileText,
  datasheet: FileType2,
  cad: Box,
  certificate: ShieldCheck,
  schematic: FileCode,
};

/** Downloadable document row (datasheet/manual/CAD). A datasheet click is a
 *  micro-conversion — keep it one tap, no gate for public docs (PRODUCT-PAGE §7). */
export function DocumentDownload({ document, className }: { document: DocumentModel; className?: string }) {
  const Icon = ICON[document.type];
  const meta = [document.type, document.version, document.language, document.sizeLabel]
    .filter(Boolean)
    .join(" · ");
  return (
    <a
      href={document.url}
      download
      className={cn(
        "flex items-center gap-3 rounded-lg border p-3 transition-colors",
        "hover:border-primary/40 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary">
        <Icon className="size-4 text-primary" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{document.title}</span>
        <span className="block font-mono text-xs uppercase text-muted-foreground">{meta}</span>
      </span>
      <Download className="size-4 shrink-0 text-muted-foreground" aria-hidden />
    </a>
  );
}
