import withBundleAnalyzer from "@next/bundle-analyzer";
import fs from "fs";
import { DEVICE_SIZES } from "./lib/images.config";
import type { NextConfig } from "next";
import path from "path";

// Projects used to live at /work/<slug> and those URLs are indexed, so they
// need a real 308 — permanentRedirect() inside a prerendered page only emits a
// 200 HTML shell that redirects on the client, which crawlers do not treat as
// permanent. Read from disk rather than lib/md: that module imports the
// generated .velite JSON, and this file is evaluated before velite has run.
function movedProjectSlugs(): string[] {
  const slugsIn = (folder: string) => {
    try {
      return fs
        .readdirSync(path.join(process.cwd(), "md", folder))
        .filter((f) => f.endsWith(".md"))
        .map((f) => f.replace(/\.md$/, ""));
    } catch {
      return [];
    }
  };
  // A slug present in both folders belongs to /work — never redirect it away.
  const career = new Set(slugsIn("work"));
  return slugsIn("projects").filter((slug) => !career.has(slug));
}

// Velite generates the typed content layer in `.velite/` that lib/md.ts imports
// (see velite.config.ts). Producing it is deliberately *not* this file's job.
//
// next.config is evaluated as Next starts, and nothing awaits a build kicked
// off from here — so it races the compiler resolving `../.velite/blog.json`,
// and because the config asks Velite to `clean`, that file is deleted and
// rewritten on every build, which means the window exists every time. Measured
// on this machine: a cold Velite run takes ~13.6s against a compile that
// finishes in ~7s. It only ever won because Velite happened to be warm.
//
// Generation belongs to `postinstall` and scripts/pipeline.mjs, both of which
// await it. All that is left here is the dev watcher, which has nothing racing
// it because `.velite` already exists by the time `next dev` starts.
const isDev = process.argv.includes("dev");
if (isDev && !process.env.VELITE_WATCHING) {
  process.env.VELITE_WATCHING = "1";
  import("velite")
    .then((m) => m.build({ watch: true, clean: false }))
    .catch((err) => {
      console.error("[velite] watch failed:", err);
    });
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
  // is ~17 KB gzip, and Inter is loaded through next/font (app/layout.tsx),
  // which emits its own preload rather than going through this stylesheet.
  // /blog/:slug.md serves the markdown source, so that route reads files no
  // import graph can see. The tracer does currently infer them on its own —
  // the path is scoped to md/ before the dynamic part — so this is not load
  // bearing today; it states the requirement rather than leaving the route
  // dependent on that inference holding.
  outputFileTracingIncludes: {
    "/api/blog/[slug]/raw": ["./md/blog/**/*.md"],
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
  async redirects() {
    return [
      ...movedProjectSlugs().map((slug) => ({
        source: `/work/${slug}`,
        destination: `/projects/${slug}`,
        permanent: true,
      })),
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
        source: "/blog-img/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/project-img/:path*",
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
    deviceSizes: [...DEVICE_SIZES],
    imageSizes: [16, 32, 48, 60, 64, 96, 120, 128, 140, 256, 280, 384],
    minimumCacheTTL: 31536000,
  },
  turbopack: {
    root: path.resolve("."),
  },
};

export default withBA(nextConfig);
