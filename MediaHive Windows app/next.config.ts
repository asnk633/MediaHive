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
  eslint: {
    ignoreDuringBuilds: true,
  },
};

if (process.env.NODE_ENV === "development") {
  nextConfig.turbopack = {
    root: path.resolve(__dirname, ".."),
  };
}

export default nextConfig;
