import { cache } from "react";
import blogPosts from "./data/blog-posts.json";

export type HashnodePost = {
  title: string;
  slug: string;
  publishedAt: string;
  brief?: string;
  coverImage?: {
    url: string;
  };
  content?: {
    markdown: string;
  };
  url?: string;
};

export const getAllBlogPosts = cache(async (): Promise<HashnodePost[]> => {
  // Sort posts by publishedAt descending
  return [...blogPosts].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  ) as HashnodePost[];
});

export const getBlogPost = cache(
  async (slug: string): Promise<HashnodePost | null> => {
    const post = blogPosts.find((p) => p.slug === slug);
    return (post as HashnodePost) || null;
  }
);

