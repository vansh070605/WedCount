import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // lib/docs.ts reads docs/*.md at runtime; make sure Vercel ships them with every function.
  outputFileTracingIncludes: { "/*": ["./docs/*.md"] },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
