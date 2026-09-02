import withBundleAnalyzer from "@next/bundle-analyzer";
import fs from "fs";
import {
  MARKDOWN_ACCEPT_PATTERN,
  PAGE_PATH_PATTERN,
} from "./lib/content-negotiation";
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
  // Markdown representations, in the routing layer rather than middleware.
  // proxy.ts used to run in front of every HTML request to read the Accept
  // header and add a Link header; both are expressible here, where they are
  // evaluated by the CDN's router with no function in the request path.
  //
  // The negotiation rules are `beforeFiles` because they have to win over an
  // existing page: an afterFiles rewrite is only consulted once no page or
  // public file matched, and /about is a page. The `.md` siblings have no page
  // of their own, so they sit in afterFiles — and the blog's raw-source rule
  // must come before the generic one.
  async rewrites() {
    const wantsMarkdown = [
      { type: "header" as const, key: "accept", value: MARKDOWN_ACCEPT_PATTERN },
    ];
    return {
      beforeFiles: [
        {
          // Accept: text/markdown against a canonical URL. See
          // MARKDOWN_ACCEPT_PATTERN for what counts.
          source: `/:path(${PAGE_PATH_PATTERN})`,
          has: wantsMarkdown,
          destination: "/api/markdown/:path",
        },
        {
          source: "/",
          has: wantsMarkdown,
          destination: "/api/markdown",
        },
      ],
      afterFiles: [
        {
          // /blog/my-post.md  →  the authored markdown, verbatim
          source: "/blog/:slug.md",
          destination: "/api/blog/:slug/raw",
        },
        {
          source: "/index.md",
          destination: "/api/markdown",
        },
        {
          // /about.md, /work/bifrost.md, … → the page's Markdown rendering.
          source: "/:path*.md",
          destination: "/api/markdown/:path*",
        },
      ],
      fallback: [],
    };
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
    const alternate = (path: string) => ({
      key: "Link",
      value: `<https://www.swapnoneel.site${path}>; rel="alternate"; type="text/markdown"`,
    });
    // The .md siblings are alternates of the canonical pages and must not be
    // indexed in their own right. Set here, keyed on the URL the client asked
    // for, because a query string added by a rewrite does not reach the route
    // handler's request URL. agent-instructions.md is a literal public file,
    // not a sibling, and is left indexable as before.
    const noindex = { key: "X-Robots-Tag", value: "noindex" };
    // Advertises the Markdown sibling on every page, as the middleware did.
    // No `Vary: Accept` here: Next writes its own Vary on prerendered HTML and
    // a value from this list does not merge into it (verified against `next
    // start`). The CDN does not need it — a negotiated request is rewritten to
    // /api/markdown/* before any cache lookup, so the two representations never
    // share a cache key — and the Markdown route sets Vary: Accept itself.
    return [
      {
        source: "/:path((?!agent-instructions\\.md$).*\\.md)",
        headers: [noindex],
      },
      {
        source: "/",
        headers: [alternate("/index.md")],
      },
      {
        source: `/:path(${PAGE_PATH_PATTERN})`,
        headers: [alternate("/:path.md")],
      },
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
      {
        // Content-hashed by scripts/generate-ui-images.mjs, so a changed source
        // gets a new URL and the old one can be cached forever.
        source: "/ui-img/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // Narration manifests are static files but were served with max-age=0.
        // They only change with a deploy, and the player re-checks the token
        // count against the article before trusting one, so a stale copy can
        // hide the player for an hour but never mis-highlight.
        source: "/narration/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600, stale-while-revalidate=86400",
          },
        ],
      },
    ];
  },
  // No page renders through /_next/image any more: blog images, project
  // covers, the profile portraits and the work logos are all encoded at build
  // time and served as static <picture> sources (see components/static-image
  // and the generate-*/mirror-* scripts). The optimizer still answers one URL —
  // the og:image in app/blog/[slug]/page.tsx, which social scrapers fetch and
  // which needs a format they all decode — so the settings that URL depends on
  // stay: a remote host for covers that never mirrored, 1280 in the width list
  // and 75 in the quality list.
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
    qualities: [75, 90],
    // Shared with the build-time encoders through lib/images.config.ts.
    deviceSizes: [...DEVICE_SIZES],
    minimumCacheTTL: 31536000,
  },
  turbopack: {
    root: path.resolve("."),
  },
};

export default withBA(nextConfig);
