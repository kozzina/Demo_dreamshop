import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // The dev-only «N» badge sits on top of the phone screens in the case page; build errors still show.
  devIndicators: false,
  // The assistant reads content/knowledge.md at runtime in API routes (chat, Telegram webhook):
  // ship the file with those functions.
  outputFileTracingIncludes: {
    "/api/**": ["./content/**"],
  },
};

export default nextConfig;
