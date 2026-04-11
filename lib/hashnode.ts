import { siteConfig } from "@/lib/config";
import { cache } from "react";

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

type HashnodePostEdge = {
  node: HashnodePost;
};

type HashnodeListResponse = {
  data?: {
    publication?: {
      posts?: {
        edges?: HashnodePostEdge[];
      };
    };
  };
};

type HashnodePostResponse = {
  data?: {
    publication?: {
      post?: HashnodePost | null;
    };
  };
};

export const getAllBlogPosts = cache(async (): Promise<HashnodePost[]> => {
  const query = `
    query Publication {
      publication(host: "${siteConfig.hashnode.host}") {
        posts(first: 50) {
          edges {
            node {
              title
              slug
              publishedAt
              url
            }
          }
        }
      }
    }
  `;

  try {
    const res = await fetch(siteConfig.hashnode.graphQlEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
      next: { revalidate: 3600 }, // Cache for 1 hour
    });
    const { data }: HashnodeListResponse = await res.json();
    return data?.publication?.posts?.edges?.map((edge) => edge.node) ?? [];
  } catch (error) {
    console.error("Failed to fetch blog posts from Hashnode", error);
    return [];
  }
});

export const getBlogPost = cache(
  async (slug: string): Promise<HashnodePost | null> => {
    const query = `
    query Publication {
      publication(host: "${siteConfig.hashnode.host}") {
        post(slug: "${slug}") {
          title
          slug
          publishedAt
          url
          content {
            markdown
          }
        }
      }
    }
  `;

    try {
      const res = await fetch(siteConfig.hashnode.graphQlEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
        next: { revalidate: 3600 },
      });
      const { data }: HashnodePostResponse = await res.json();
      return data?.publication?.post ?? null;
    } catch (error) {
      console.error("Failed to fetch blog post from Hashnode", error);
      return null;
    }
  }
);
