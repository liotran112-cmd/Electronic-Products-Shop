/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Internal packages ship raw TS/TSX and are compiled by the app.
  transpilePackages: [
    "@repo/ui",
    "@repo/analytics",
    "@repo/db",
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
  typedRoutes: true,
};

export default nextConfig;
