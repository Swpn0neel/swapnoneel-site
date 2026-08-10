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
  async redirects() {
    return [
      {
        // Cards rendered on demand by /api/og?title=… until the route was
        // replaced by build-time opengraph-image files. Links shared before that
        // still carry the old URL, so send re-crawls to the site card rather
        // than a 404.
        source: "/api/og",
        destination: "/opengraph-image",
        permanent: true,
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
    // Next encodes AVIF at `quality - 20` (see optimizeImage in
    // next/dist/server/image-optimizer.js), so the default 75 ships AVIF q55 —
    // visibly soft on screenshots and diagrams. 90 lands the AVIF at q70.
    //
    // Blog images no longer come through here at all; they are pre-encoded at
    // build time and served by the loader in lib/blog-image-loader.ts. This
    // still covers the two paths that remain: blog images that failed to mirror
    // (dead upstream URLs) and the OG card URL in app/blog/[slug]/page.tsx.
    //
    // 75 stays in the list because it is Next's default and every image that
    // does not opt in explicitly still requests it — dropping it 400s them.
    qualities: [75, 90],
    // next/image builds its srcset from these whatever loader is in play, so
    // this list decides which AVIF renditions scripts/mirror-blog-images.mjs
    // has to emit as well. Four widths cover the real layout — 640 for 1x
    // phones, 960 for 1x desktop, 1280 for high-DPR phones, 1536 for retina
    // desktop.
    //
    // 1536 is here because the column is ~770px, so a 2x desktop wants 1540 and
    // the old 1280 ceiling served it 1.66x. It only pays off for sources wide
    // enough to fill it, which is why MAX_WIDTH in scripts/mirror-blog-images.mjs
    // tracks this value — the two have to move together, or the widest srcset
    // candidate is a narrower file the browser then upscales.
    deviceSizes: [640, 960, 1280, 1536],
    imageSizes: [16, 32, 48, 60, 64, 96, 120, 128, 140, 256, 280, 384],
    minimumCacheTTL: 31536000,
  },
  turbopack: {
    root: path.resolve("."),
  },
};

export default withBA(nextConfig);
