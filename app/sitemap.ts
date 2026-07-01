import { getAllBlogPosts, getAllProjects, getAllWorkItems } from "@/lib/md";
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

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/work`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/work/others`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/resume`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/feed.xml`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.3,
    },
  ];

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
    url: `${baseUrl}/work/${project.meta.slug}`,
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
