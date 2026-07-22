export function Logo({ className }: { className?: string }) {
  return (
    <span className={className} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="10.5" stroke="hsl(var(--primary))" strokeWidth="1.5" />
        <path d="M13 4.5 7.5 13H12l-1 6.5L16.5 11H12l1-6.5Z" fill="hsl(var(--primary))" />
      </svg>
      <span className="text-lg font-semibold tracking-tight">Ampere</span>
    </span>
  );
}
