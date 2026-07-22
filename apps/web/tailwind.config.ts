import type { Config } from "tailwindcss";

import { preset } from "@repo/config/tailwind/preset";

export default {
  presets: [preset],
  content: [
    "./src/**/*.{ts,tsx}",
    // include the shared UI library so its class names are not purged
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
} satisfies Config;
