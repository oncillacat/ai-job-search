import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // One stamp per build, shared by server and browser code, so an open page can tell the
  // server was rebuilt under it (and ask for a reload instead of silently missing new events).
  env: { NEXT_PUBLIC_BUILD_STAMP: String(Date.now()) },
  // The Mac app (scripts/build-mac-app.sh) ships a self-contained server; other builds don't need it.
  output: process.env.BUILD_STANDALONE ? "standalone" : undefined,
  cacheComponents: true,
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
