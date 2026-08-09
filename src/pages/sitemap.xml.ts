import { getBlogPosts, getProjects, getWorkItems } from "@/lib/content";
import type { APIRoute } from "astro";

/**
 * Hand-rolled rather than @astrojs/sitemap, for one reason: that integration
 * emits /sitemap-index.xml + /sitemap-0.xml, and this site publishes
 * /sitemap.xml. That URL is in robots.txt and is what Search Console has
 * already crawled, so moving it is a needless SEO change for a site with 69
 * pages — the integration's splitting only earns its keep in the tens of
 * thousands.
 *
 * Keeping it also keeps the per-route priorities and lastmod values the old
 * app/sitemap.ts set, which serialize() in the integration would have had to
 * reconstruct from URL patterns.
 */

const SITE = "https://www.swapnoneel.site";

type Entry = {
  path: string;
  lastmod: Date;
  changefreq: "weekly" | "monthly";
  priority: number;
};

export const GET: APIRoute = async () => {
  const now = new Date();
  const [posts, work, projects] = await Promise.all([
    getBlogPosts(),
    getWorkItems(),
    getProjects(),
  ]);

  const entries: Entry[] = [
    { path: "/", lastmod: now, changefreq: "weekly", priority: 1 },
    { path: "/blog", lastmod: now, changefreq: "weekly", priority: 0.9 },
    { path: "/work", lastmod: now, changefreq: "weekly", priority: 0.9 },
    {
      path: "/work/others",
      lastmod: now,
      changefreq: "monthly",
      priority: 0.6,
    },
    { path: "/contact", lastmod: now, changefreq: "monthly", priority: 0.5 },
    { path: "/resume", lastmod: now, changefreq: "monthly", priority: 0.6 },
    { path: "/feed.xml", lastmod: now, changefreq: "weekly", priority: 0.3 },
    ...posts.map((post) => ({
      path: `/blog/${post.slug}`,
      lastmod: post.updatedAt ?? post.publishedAt,
      changefreq: "monthly" as const,
      priority: 0.8,
    })),
    ...work.map((item) => ({
      path: `/work/${item.id}`,
      lastmod: parseDate(item.data.date),
      changefreq: "monthly" as const,
      priority: 0.7,
    })),
    ...projects.map((project) => ({
      path: `/work/${project.id}`,
      lastmod: project.data.date,
      changefreq: "monthly" as const,
      priority: 0.6,
    })),
  ];

  // Last write wins, static routes first, so a dynamic slug that collides with
  // one of them takes precedence — same dedup the old sitemap did.
  const bySlug = new Map<string, Entry>();
  for (const entry of entries) bySlug.set(entry.path, entry);

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...bySlug.values()]
  .map(
    (entry) => `  <url>
    <loc>${SITE}${entry.path}</loc>
    <lastmod>${entry.lastmod.toISOString()}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>
`;

  return new Response(body, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
};

/** Work dates are human-readable ranges ("May 2024 - Jan 2025"). */
function parseDate(value: string): Date {
  const start = value.split(/[-–]/)[0].trim();
  if (start.toLowerCase() === "present") return new Date();
  const date = new Date(start);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}
