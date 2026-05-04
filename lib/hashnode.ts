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

async function fetchFromHashnode<T>(
  query: string,
  errorMessage: string,
  variables?: Record<string, any>
): Promise<T | null> {
  try {
    const res = await fetch(siteConfig.hashnode.graphQlEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables }),
      next: { revalidate: 3600 },
    });
    return (await res.json()) as T;
  } catch (error) {
    console.error(errorMessage, error);
    return null;
  }
}

export const getAllBlogPosts = cache(async (): Promise<HashnodePost[]> => {
  const query = `
    query Publication($host: String!) {
      publication(host: $host) {
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

  const response = await fetchFromHashnode<HashnodeListResponse>(
    query,
    "Failed to fetch blog posts from Hashnode",
    { host: siteConfig.hashnode.host }
  );
  return (
    response?.data?.publication?.posts?.edges?.map((edge) => edge.node) ?? []
  );
});

export const getBlogPost = cache(
  async (slug: string): Promise<HashnodePost | null> => {
    const query = `
    query Publication($host: String!, $slug: String!) {
      publication(host: $host) {
        post(slug: $slug) {
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

    const response = await fetchFromHashnode<HashnodePostResponse>(
      query,
      "Failed to fetch blog post from Hashnode",
      { host: siteConfig.hashnode.host, slug }
    );
    return response?.data?.publication?.post ?? null;
  }
);
