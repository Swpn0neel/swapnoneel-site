import { getAllBlogPosts, getBlogPost } from "@/lib/hashnode";
import { i18n } from "@/lib/i18n";
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
    .replace(/<\/?mark(?:\s+[^>]*?)?>/gi, "");

  return (
    <article className="pb-16">
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
