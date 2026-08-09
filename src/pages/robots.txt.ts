import type { APIRoute } from "astro";

/** The sitemap keeps its /sitemap.xml URL — see src/pages/sitemap.xml.ts. */
export const GET: APIRoute = ({ site }) => {
  const sitemap = new URL("sitemap.xml", site ?? "https://www.swapnoneel.site");
  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${sitemap.href}\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
