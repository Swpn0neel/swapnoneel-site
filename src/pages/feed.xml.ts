import rss from "@astrojs/rss";
import type { APIRoute } from "astro";
import { getBlogPosts } from "@/lib/content";
import { siteConfig } from "@/lib/config";

/**
 * The path stays /feed.xml. It is in the sitemap, it is advertised from a
 * <link rel="alternate"> in the layout, and it is what any existing subscriber
 * is polling — @astrojs/rss defaults to rss.xml, which would have silently
 * orphaned them.
 */
export const GET: APIRoute = async (context) => {
  const posts = await getBlogPosts();

  return rss({
    title: `${siteConfig.person.fullName} - Blog`,
    description: siteConfig.metadata.description,
    site: context.site ?? "https://www.swapnoneel.site",
    trailingSlash: false,
    items: posts.map((post) => ({
      title: post.title,
      description: post.description,
      link: `/blog/${post.slug}`,
      pubDate: post.publishedAt,
    })),
    customData: "<language>en-us</language>",
  });
};
