import type { RichText as RichTextValue } from "@repo/domain";
import { cn } from "@repo/ui";

/** Flatten a portable-text block (and its children) to plain text. */
function blockToText(block: RichTextValue[number]): string {
  if (typeof block.text === "string") return block.text;
  if (block.children) return block.children.map(blockToText).join("");
  return "";
}

/**
 * Minimal portable-text renderer. The domain layer keeps rich text opaque, so
 * the frontend owns interpretation; this renders block-level paragraphs. Richer
 * marks (links, lists) land when editorial content needs them (2nd real use).
 */
export function RichText({ value, className }: { value?: RichTextValue; className?: string }) {
  if (!value || value.length === 0) return null;
  return (
    <div className={cn("max-w-none space-y-3 text-sm leading-relaxed text-muted-foreground", className)}>
      {value.map((block, i) => {
        const text = blockToText(block);
        return text ? <p key={i}>{text}</p> : null;
      })}
    </div>
  );
}
