import { nextConfig } from "@repo/config/eslint/next";

export default [
  // Next generates next-env.d.ts (triple-slash refs) and .next/ output.
  { ignores: ["next-env.d.ts", ".next/**"] },
  ...nextConfig,
];
