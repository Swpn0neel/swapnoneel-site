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
  // inlineCss is deliberately off. It re-serialises the entire compiled
  // stylesheet into every HTML document *and* into every RSC navigation
  // payload — twice per payload, once for the head segment and once for the
  // page segment. Measured on the deployed site, that made a client-side
  // navigation to /contact ship 217 KB of which 205 KB was two identical
  // copies of the stylesheet, taking ~1.5s on a cold visit before the page's
  // own JS chunks could even be requested. Linked instead, the same navigation
  // is 12 KB and the stylesheet is cached once for the whole site.
  //
  // The cost is that the stylesheet is render-blocking on the first page. It
  // is ~12 KB brotli, and the Inter face was moved out to its own preloaded
  // file to keep it that small (see scripts/generate-font-subset.mjs).
  async rewrites() {
    return [
      {
        // /blog/my-post.md  →  /api/blog/my-post/raw
        source: "/blog/:slug.md",
        destination: "/api/blog/:slug/raw",
      },
    ];
  },
  async headers() {
    return [
      {
        // Everything under /public is served `max-age=0` by default, which
        // would put a revalidation round trip in front of the font on every
        // page load — most of what moving it out of the CSS was meant to
        // avoid. Unlike a build chunk the name carries no content hash, so if
        // the subset in scripts/generate-font-subset.mjs ever changes, the
        // filename has to change with it (here and in the layout preload).
        source: "/font/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
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
