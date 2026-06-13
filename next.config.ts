import type { NextConfig } from "next";
import path from "path";

if (typeof global !== "undefined") {
  delete (globalThis as { localStorage?: unknown }).localStorage;
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 768, 1024, 1280, 1536],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000,
  },
  turbopack: {
    root: path.resolve("."),
  },
};

export default nextConfig;
