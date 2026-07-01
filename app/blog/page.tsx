import { BlogList } from "@/components/blog-list";
import { i18n } from "@/lib/i18n";
import { getAllBlogPosts } from "@/lib/md";
import { ogImageUrl, safeJsonLd } from "@/lib/utils";

export const metadata = {
  title: i18n.blog.title,
  description: i18n.blog.description,
  alternates: {
    canonical: "/blog",
  },
  openGraph: {
    title: i18n.blog.title,
    description: i18n.blog.description,
    url: "https://www.swapnoneel.site/blog",
    type: "website",
    images: [
      {
        url: ogImageUrl(i18n.blog.title, i18n.blog.description),
        width: 1200,
        height: 630,
        alt: i18n.blog.title,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: i18n.blog.title,
    description: i18n.blog.description,
    images: [ogImageUrl(i18n.blog.title, i18n.blog.description)],
  },
};

export default async function BlogPage() {
  const posts = await getAllBlogPosts();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd({
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "Blog Posts",
            itemListElement: posts.map((post, index) => ({
              "@type": "ListItem",
              position: index + 1,
              url: `https://www.swapnoneel.site/blog/${post.slug}`,
              name: post.title,
            })),
          }),
        }}
      />
      <BlogList posts={posts} />
    </>
  );
}
