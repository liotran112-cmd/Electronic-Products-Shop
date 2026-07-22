/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Internal packages ship raw TS/TSX and are compiled by the app.
  transpilePackages: [
    "@repo/ui",
    "@repo/analytics",
    "@repo/bff",
    "@repo/cache",
    "@repo/core",
    "@repo/db",
    "@repo/domain",
    "@repo/email",
    "@repo/env",
    "@repo/events",
    "@repo/kv",
    "@repo/media",
    "@repo/sanity",
    "@repo/search",
    "@repo/shopify",
  ],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "cdn.shopify.com" },
    ],
  },
  // Routes are data-driven (hrefs come from the BFF as strings), so typedRoutes
  // (which validates against statically-known routes) is intentionally off.
  typedRoutes: false,
};

export default nextConfig;
