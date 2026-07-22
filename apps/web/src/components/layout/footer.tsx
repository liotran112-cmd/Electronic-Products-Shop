import Link from "next/link";

import { Logo } from "./logo";

const COLUMNS = [
  { heading: "Shop", links: [["Smartphones", "/c/smartphones"], ["Smart Home", "/c/smart-home"], ["IoT Devices", "/c/iot-devices"], ["Accessories", "/c/accessories"]] },
  { heading: "Learn", links: [["Tutorials", "/learn"], ["Documentation", "/docs"], ["Firmware", "/firmware"]] },
  { heading: "Solutions", links: [["Custom devices", "/custom"], ["Request a quote", "/quote"], ["For business", "/business"]] },
  { heading: "Company", links: [["About", "/about"], ["Support", "/support"], ["Contact", "/contact"]] },
] as const;

export function Footer() {
  return (
    <footer className="mt-24 border-t bg-secondary/30">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.5fr_repeat(4,1fr)]">
        <div>
          <Logo />
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            Electronics, beautifully discovered — consumer devices and custom builds with
            technical depth.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <nav key={col.heading} aria-label={col.heading}>
            <h2 className="mb-3 font-mono text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {col.heading}
            </h2>
            <ul className="space-y-2">
              {col.links.map(([label, href]) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-foreground/80 transition-colors hover:text-primary"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t">
        <p className="mx-auto max-w-7xl px-4 py-6 text-xs text-muted-foreground sm:px-6">
          © 2026 Ampere. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
