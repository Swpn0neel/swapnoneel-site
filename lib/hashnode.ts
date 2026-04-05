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

const HASHNODE_GQL_ENDPOINT = "https://gql.hashnode.com/";
const HOST = "swapnoneel.hashnode.dev";

export async function getAllBlogPosts(): Promise<HashnodePost[]> {
  const query = `
    query Publication {
      publication(host: "${HOST}") {
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
    const res = await fetch(HASHNODE_GQL_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
      next: { revalidate: 3600 }, // Cache for 1 hour
    });
    const { data } = await res.json();
    return data?.publication?.posts?.edges?.map((edge: any) => edge.node) || [];
  } catch (error) {
    console.error("Failed to fetch blog posts from Hashnode", error);
    return [];
  }
}

export async function getBlogPost(slug: string): Promise<HashnodePost | null> {
  const query = `
    query Publication {
      publication(host: "${HOST}") {
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
    const res = await fetch(HASHNODE_GQL_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
      next: { revalidate: 3600 },
    });
    const { data } = await res.json();
    return data?.publication?.post || null;
  } catch (error) {
    console.error("Failed to fetch blog post from Hashnode", error);
    return null;
  }
}
