import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Pin the output file tracing root to this app's directory so Next.js
  // never shells out to git.exe to discover the monorepo root in CI.
  outputFileTracingRoot: path.join(__dirname, ".."),
  // Pin the Turbopack workspace root explicitly for the same reason.
  turbopack: {
    root: path.resolve(__dirname, ".."),
  },
};

export default nextConfig;
