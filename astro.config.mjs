// @ts-check
import { unified } from "@astrojs/markdown-remark";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import vercel from "@astrojs/vercel";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

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

  // react() is here for exactly one component: components/blog-narrator.tsx.
  // Every other island on this site is vanilla TS. When the narrator is
  // rewritten (the final migration phase), this integration and react/react-dom
  // come out and the site ships zero framework JavaScript.
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

  markdown: {
    // Astro 7's default processor is Sätteri (mdastPlugins/hastPlugins). The
    // remark/rehype pipeline is opted into here because the transforms this
    // site needs — external-link rel, code-block copy buttons, the <picture>
    // rewrite for blog images — are being written against that ecosystem.
    processor: unified({}),
    // Replaces rehype-highlight and its stylesheet: Shiki runs at build and
    // emits inline styles, so code blocks cost no CSS and no client JS.
    shikiConfig: {
      themes: { light: "github-light", dark: "github-dark" },
    },
  },
});
