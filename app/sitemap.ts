import { getAllBlogPosts, getAllProjects, getAllWorkItems } from "@/lib/md";
import type { MetadataRoute } from "next";

function parseValidDate(dateStr: string | undefined): Date {
  if (!dateStr) return new Date();
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? new Date() : date;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://swapnoneel.site";
  const blogPosts = getAllBlogPosts();
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
  ];

  const blogRoutes: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${baseUrl}/blog/${post.meta.slug}`,
    lastModified: parseValidDate(post.meta.date),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  const workRoutes: MetadataRoute.Sitemap = workItems.map((item) => ({
    url: `${baseUrl}/work/${item.meta.slug}`,
    lastModified: parseValidDate(item.meta.date),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const projectRoutes: MetadataRoute.Sitemap = projects.map((project) => ({
    url: `${baseUrl}/work/${project.meta.slug}`,
    lastModified: parseValidDate(project.meta.date),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const allRoutes = [
    ...staticRoutes,
    ...blogRoutes,
    ...workRoutes,
    ...projectRoutes,
  ];
  const uniqueRoutes = Array.from(
    new Map(allRoutes.map((route) => [route.url, route])).values()
  );

  return uniqueRoutes;
}
