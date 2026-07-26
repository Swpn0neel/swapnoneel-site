import withBundleAnalyzer from "@next/bundle-analyzer";
import type { NextConfig } from "next";
import path from "path";

if (typeof global !== "undefined") {
  delete (globalThis as { localStorage?: unknown }).localStorage;
}

const withBA = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  experimental: {
    inlineCss: true,
  },
  async rewrites() {
    return [
      {
        // /blog/my-post.md  →  /api/blog/my-post/raw
        source: "/blog/:slug.md",
        destination: "/api/blog/:slug/raw",
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.hashnode.com",
      },
      {
        protocol: "https",
        hostname: "cdn.simpleicons.org",
      },
      {
        protocol: "https",
        hostname: "wp.keploy.io",
      },
      {
        protocol: "https",
        hostname: "dev-to-uploads.s3.us-east-2.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "images.pexels.com",
      },
    ],
    formats: ["image/avif", "image/webp"],
    qualities: [75],
    // Every (url, width, quality) triple is its own optimizer cache entry, and
    // a miss costs a transcode before the first byte ships. Three widths cover
    // the real layout — 640 for 1x phones, 960 for 2x phones and 1x desktop,
    // 1280 for retina desktop — while keeping misses rare. It also stops a
    // small high-DPR phone from pulling a 1536px rendition it cannot resolve
    // (see IMAGE_SIZES in components/blog-image.tsx).
    deviceSizes: [640, 960, 1280],
    imageSizes: [16, 32, 48, 60, 64, 96, 120, 128, 140, 256, 280, 384],
    minimumCacheTTL: 31536000,
  },
  turbopack: {
    root: path.resolve("."),
  },
};

export default withBA(nextConfig);
