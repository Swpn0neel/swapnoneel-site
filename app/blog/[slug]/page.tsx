import { siteConfig } from "@/lib/config";
import { getAllBlogPosts, getBlogPost } from "@/lib/hashnode";
import { i18n } from "@/lib/i18n";
import { safeJsonLd } from "@/lib/utils";
import { MDXRemote } from "next-mdx-remote/rsc";
import Link from "next/link";
import { notFound } from "next/navigation";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";

export const dynamicParams = false;

export async function generateStaticParams() {
  const posts = await getAllBlogPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.brief,
    alternates: {
      canonical: `/blog/${slug}`,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) notFound();

  const d = new Date(post.publishedAt);
  const dateStr = d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const cleanMarkdown = (post.content?.markdown || "")
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/<\/?mark(?:\s+[^>]*?)?>/gi, "")
    .replace(/%%?\[.*?\]/g, "");

  return (
    <article className="pb-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: post.title,
            description: post.brief,
            datePublished: post.publishedAt,
            author: {
              "@type": "Person",
              name: siteConfig.person.fullName,
              url: "https://www.swapnoneel.site",
            },
            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": `https://www.swapnoneel.site/blog/${slug}`,
            },
          }),
        }}
      />
      <div className="mb-8">
        <Link
          href="/blog"
          className="text-muted-foreground hover:text-foreground text-xs transition-colors"
        >
          ← {i18n.blog.backLink}
        </Link>
        <h1 className="mt-4 mb-2 text-xl font-semibold">{post.title}</h1>
        <p className="text-muted-foreground flex items-center justify-between text-xs">
          <span>{dateStr}</span>
          {post.url && (
            <a
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground border-border hover:bg-secondary rounded border px-2 py-1 transition-colors"
            >
              {i18n.blog.readOnHashnode}
            </a>
          )}
        </p>
      </div>
      <div className="prose prose-sm max-w-none">
        <MDXRemote
          source={cleanMarkdown}
          options={{
            mdxOptions: {
              remarkPlugins: [remarkGfm],
              rehypePlugins: [rehypeHighlight],
            },
          }}
        />
      </div>
    </article>
  );
}
