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
  // Always set turbopack.root so Next.js doesn't auto-detect the wrong
  // workspace root when multiple pnpm-lock.yaml files exist in CI.
  turbopack: {
    root: path.resolve(__dirname, ".."),
  },
};

export default nextConfig;
