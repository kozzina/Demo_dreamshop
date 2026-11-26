import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // The assistant reads content/knowledge.md at runtime in API routes (chat, Telegram webhook):
  // ship the file with those functions.
  outputFileTracingIncludes: {
    "/api/**": ["./content/**"],
  },
};

export default nextConfig;
