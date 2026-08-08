// @ts-check
import { unified } from "@astrojs/markdown-remark";
import sitemap from "@astrojs/sitemap";
import vercel from "@astrojs/vercel";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, fontProviders } from "astro/config";

export default defineConfig({
  site: "https://www.swapnoneel.site",

  // Every route is prerendered. The Vercel adapter emits no serverless function
  // unless a route opts out with `export const prerender = false`, so this build
  // is byte-for-byte the same static output as having no adapter at all. The
  // adapter earns its place for the Vercel-only services the site already uses:
  // Web Analytics and Speed Insights, which are unavailable to a static Astro
  // site without it. It also leaves `security.csp` + `staticHeaders` and Astro
  // Actions one config line away if they are ever wanted.
  output: "static",
  adapter: vercel(),

  // No react() yet, deliberately. Registering the integration emits its 191 KB
  // client renderer into dist/_astro even when no island uses it — dead weight
  // in the deploy. It comes back in Phase 4, when blog-narrator (the one React
  // holdout) actually needs it, and goes again for good once that is rewritten.
  integrations: [sitemap()],

  vite: {
    plugins: [tailwindcss()],
  },

  image: {
    // sharp's `effort` and the encoder options below are the two things
    // next/image would not expose — see the DEVICE_SIZES block in the old
    // scripts/mirror-blog-images.mjs for the measurements that made them
    // matter. Encoding happens once, at build, from the original buffer.
    service: {
      entrypoint: "astro/assets/services/sharp",
      config: {
        limitInputPixels: false,
        avif: { effort: 6, quality: 70 },
        webp: { effort: 6, quality: 80 },
      },
    },
    // The rendered column is ~770px (max-w-2xl at a 120% root font-size), so
    // these four cover the real layout: 640 for 1x phones, 960 for 1x desktop,
    // 1280 for high-DPR phones, 1536 for retina desktop.
    breakpoints: [640, 960, 1280, 1536],
    layout: "constrained",
    // Tailwind 4 owns image sizing. Astro's defaults use :where() but are not
    // in a cascade layer, so they would outrank every Tailwind utility.
    responsiveStyles: false,
  },

  // The subsetting pipeline is gone; this ships the full variable face. It
  // costs ~27 KB more on a cold first visit and nothing after that, in exchange
  // for deleting a Python/fonttools build step, a generated stylesheet, a
  // hand-written preload and a filename that had to be kept in sync in three
  // places. Astro emits the @font-face, a metric-matched fallback, a hashed
  // filename and the immutable cache headers.
  fonts: [
    {
      provider: fontProviders.local(),
      name: "Inter",
      cssVariable: "--font-inter",
      fallbacks: ["system-ui", "sans-serif"],
      options: {
        variants: [
          {
            weight: "100 900",
            style: "normal",
            src: ["./assets/fonts/inter-latin-variable.woff2"],
            // The only value with no bad failure mode here. `swap` reflows the
            // hero block by 27.3px when the face lands, which measured a real
            // 0.027 CLS in the field; `block` risks FCP. `optional` never
            // swaps: resolved in time it paints Inter from the first paint,
            // and if not, that pageview keeps the metric-matched fallback.
            // Either way the layout is decided once and never shifts.
            display: "optional",
          },
        ],
      },
    },
  ],

  markdown: {
    // Astro 7's default processor is Sätteri (mdastPlugins/hastPlugins). The
    // remark/rehype pipeline is opted into here because the transforms this
    // site needs — external-link rel, code-block copy buttons, the <picture>
    // rewrite for blog images — are being written against that ecosystem.
    processor: unified({}),
    // Astro's built-in Shiki is off, and rehype-highlight is kept instead.
    //
    // This reverses what the migration plan said, on the evidence. Shiki would
    // have been a downgrade here, not an upgrade: both run at build time and
    // cost zero client JS, so there was never a runtime win to collect, and
    // switching would have cost three real things. The five --code-* roles in
    // global.css were picked to clear 4.5:1 on --secondary in both themes, and
    // Shiki's css-variables theme has no token for the distinction the archive
    // actually needs; its themes inline a fixed palette into the HTML, which
    // is both larger and no longer theme-aware; and lib/mdx-text.ts reads the
    // `language-*` class that rehype-highlight leaves behind to label each
    // block, which Shiki does not emit.
    syntaxHighlight: false,
  },
});
