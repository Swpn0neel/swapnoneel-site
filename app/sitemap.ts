import { getAllBlogPosts, getAllProjects, getAllWorkItems } from "@/lib/md";
import { absoluteSiteUrl, sitePages } from "@/lib/site-manifest";
import type { MetadataRoute } from "next";

function parseValidDate(dateStr: string | undefined): Date {
  if (!dateStr) return new Date();
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? new Date() : date;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://www.swapnoneel.site";
  const blogPosts = await getAllBlogPosts();
  const workItems = getAllWorkItems();
  const projects = getAllProjects();

  const staticRoutes: MetadataRoute.Sitemap = sitePages.map((page) => ({
    url: absoluteSiteUrl(page.path),
    lastModified: new Date(),
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));

  const blogRoutes: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: parseValidDate(post.updatedAt || post.publishedAt),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const workRoutes: MetadataRoute.Sitemap = workItems.map((item) => ({
    url: `${baseUrl}/work/${item.meta.slug}`,
    lastModified: parseValidDate(item.meta.date),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const projectRoutes: MetadataRoute.Sitemap = projects.map((project) => ({
    url: `${baseUrl}/projects/${project.meta.slug}`,
    lastModified: parseValidDate(project.meta.date),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  // ponytail: last-write-wins dedup via Map, static routes defined first so dynamic slugs override
  const seen = new Map<string, MetadataRoute.Sitemap[number]>();
  for (const r of [
    ...staticRoutes,
    ...blogRoutes,
    ...workRoutes,
    ...projectRoutes,
  ]) {
    seen.set(r.url, r);
  }
  return Array.from(seen.values());
}
