// @ts-check
import { unified } from "@astrojs/markdown-remark";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import vercel from "@astrojs/vercel";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, fontProviders } from "astro/config";
import rehypeHighlight from "rehype-highlight";
import { rehypeBlogImage } from "./src/plugins/rehype-blog-image.ts";
import { rehypeCodeBlock } from "./src/plugins/rehype-code-block.ts";
import { rehypeExternalLinks } from "./src/plugins/rehype-external-links.ts";

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

  // react() is here for exactly one component: src/islands/BlogNarrator.tsx.
  // Every other island on this site is vanilla TS. Because it is hydrated with
  // client:visible on the blog post route only, the renderer is fetched by that
  // route and no other — the home page, /work and /resume carry none of it.
  // When the narrator is rewritten (the final migration phase) this integration
  // and react/react-dom come out and the site ships zero framework JavaScript.
  integrations: [react(), sitemap()],

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
    processor: unified({
      rehypePlugins: [
        // Order matters: rehype-highlight tags the tokens and leaves the
        // `language-*` class on the inner <code>, which rehypeCodeBlock then
        // reads to label each block. Reversing them loses the label.
        rehypeHighlight,
        rehypeCodeBlock,
        rehypeExternalLinks,
        // After Astro has replaced each markdown image with an optimised <img>;
        // this only adds the frame, the caption and the sizes string.
        rehypeBlogImage,
      ],
    }),
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
