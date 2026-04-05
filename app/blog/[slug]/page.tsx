import { getBlogPost, getAllBlogPosts } from "@/lib/hashnode";
import { MDXRemote } from "next-mdx-remote/rsc";
import { notFound } from "next/navigation";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import Link from "next/link";

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
    title: `${post.title} — Swapnoneel Saha`,
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
    .replace(/<\/?mark>/g, "");

  return (
    <article className="pb-16">
      <div className="mb-8">
        <Link
          href="/blog"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          ← blog
        </Link>
        <h1 className="text-xl font-semibold mt-4 mb-2">{post.title}</h1>
        <p className="text-xs text-muted-foreground flex items-center justify-between">
          <span>{dateStr}</span>
          {post.url && (
            <a
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground border border-border px-2 py-1 rounded hover:bg-secondary transition-colors"
            >
              Read on Hashnode ↗
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
