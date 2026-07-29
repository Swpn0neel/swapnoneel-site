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

  // BlogList is a client component, so every prop it receives is serialised
  // into the RSC payload verbatim — including anything it never reads. A
  // BlogPost carries its whole `content.markdown`, which across 43 posts is
  // ~367 KB, and that was the entire weight of this route's payload. The list
  // renders four fields, so hand it four fields.
  const listPosts = posts.map(({ slug, title, publishedAt, urls }) => ({
    slug,
    title,
    publishedAt,
    urls,
  }));

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
      <BlogList posts={listPosts} />
    </>
  );
}
