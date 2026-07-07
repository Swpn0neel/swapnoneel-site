import { TableOfContents } from "@/components/table-of-contents";
import { siteConfig } from "@/lib/config";
import { i18n } from "@/lib/i18n";
import { getAllBlogPosts, getBlogPost } from "@/lib/md";
import { breadcrumbJsonLd, ogImageUrl, safeJsonLd } from "@/lib/utils";
import { MDXRemote } from "next-mdx-remote/rsc";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";

export const dynamicParams = false;
export const revalidate = 3600;

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
  const url = `https://www.swapnoneel.site/blog/${slug}`;
  const ogImage = ogImageUrl(post.title, post.brief);
  return {
    title: post.title,
    description: post.brief,
    alternates: {
      canonical: `/blog/${slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.brief,
      url,
      type: "article",
      publishedTime: post.publishedAt,
      images: [{ url: ogImage, width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.brief,
      images: [ogImage],
    },
  };
}

const generateSlug = (text: string) => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
};

const getRawText = (node: ReactNode): string => {
  if (!node) return "";
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node))
    return (node as ReactNode[]).map(getRawText).join("");
  if (
    node &&
    typeof node === "object" &&
    "props" in node &&
    node.props &&
    typeof node.props === "object" &&
    "children" in node.props
  ) {
    return getRawText((node.props as { children?: ReactNode }).children);
  }
  return "";
};

function extractHeadings(markdown: string) {
  const headings: { text: string; slug: string; level: number }[] = [];

  // Normalize carriage returns to avoid trailing \r on Windows
  const normalized = markdown.replace(/\r\n/g, "\n");

  // Remove multi-line code blocks entirely to avoid matching comments like ## inside code
  const withoutCodeBlocks = normalized
    .replace(/```[\s\S]*?```/g, "")
    .replace(/~~~[\s\S]*?~~~/g, "");

  const lines = withoutCodeBlocks.split("\n");

  for (const line of lines) {
    // Match h1 to h4 markdown headings
    const match = line.match(/^(#{1,4})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      let rawText = match[2].trim();

      // Strip all HTML tags completely
      rawText = rawText.replace(/<[^>]*>/g, "");

      // Strip markdown formatting symbols (bold, italic, inline code backticks)
      rawText = rawText
        .replace(/\*\*|__/g, "")
        .replace(/\*|_/g, "")
        .replace(/`([^`]+)`/g, "$1");

      rawText = rawText.trim();
      if (!rawText) continue;

      headings.push({
        text: rawText,
        slug: generateSlug(rawText),
        level,
      });
    }
  }
  return headings;
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
  const updatedDateStr =
    post.updatedAt && post.updatedAt !== post.publishedAt
      ? new Date(post.updatedAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : null;

  const cleanMarkdown = (post.content?.markdown || "")
    .replace(
      /<mark>(.*?)<\/mark>\s*\((https?:\/\/.*?)\)/gi,
      "[<mark>$1</mark>]($2)"
    )
    .replace(/(!\[.*?\]\(([^)]*?))\s+align=".*?"\)/g, "$1)")
    .replace(/%%?\[.*?\]/g, "");

  const headings = extractHeadings(cleanMarkdown);

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
            image:
              post.cover ||
              `https://www.swapnoneel.site${ogImageUrl(post.title, post.brief)}`,
            datePublished: post.publishedAt,
            ...(post.updatedAt ? { dateModified: post.updatedAt } : {}),
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd(
            breadcrumbJsonLd([
              { name: "Home", url: "https://www.swapnoneel.site" },
              { name: "Blog", url: "https://www.swapnoneel.site/blog" },
              {
                name: post.title,
                url: `https://www.swapnoneel.site/blog/${slug}`,
              },
            ])
          ),
        }}
      />
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <Link
            href="/blog"
            className="text-muted-foreground hover:text-foreground text-xs transition-colors"
          >
            ← {i18n.blog.backLink}
          </Link>
          {post.url && (
            <a
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`text-xs transition-colors sm:hidden ${
                post.url.includes("keploy")
                  ? "text-[#FF914D] hover:text-[#FF914D]/80"
                  : "text-foreground hover:text-foreground/80"
              }`}
            >
              {post.url.includes("keploy")
                ? "Read on Keploy Blogs ↗"
                : post.url.includes("dev.to")
                  ? i18n.blog.readOnDevto
                  : i18n.blog.readOnHashnode}
            </a>
          )}
        </div>

        <h1 className="text-foreground mt-4 mb-4 text-2xl font-bold tracking-tight md:text-3xl">
          {post.title}
        </h1>
        <p className="text-muted-foreground flex flex-col gap-3 text-xs sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <span>
            {dateStr}
            {post.wordCount !== undefined && ` · ${post.wordCount} words`}
            {` · ${post.readingTime} min read`}
            {updatedDateStr && ` · Updated ${updatedDateStr}`}
          </span>
          {post.url && (
            <a
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`border-border hover:bg-secondary hidden w-fit rounded border px-2 py-1 transition-colors sm:inline-flex ${
                post.url.includes("keploy")
                  ? "text-[#FF914D] hover:text-[#FF914D]/80"
                  : "text-foreground hover:text-foreground/80"
              }`}
            >
              {post.url.includes("keploy")
                ? "Read on Keploy Blogs ↗"
                : post.url.includes("dev.to")
                  ? i18n.blog.readOnDevto
                  : i18n.blog.readOnHashnode}
            </a>
          )}
        </p>
      </div>

      {/* Table of Contents Box */}
      <TableOfContents headings={headings} />

      {/* Main Content */}
      <div className="prose prose-sm justify-text max-w-none [&>*:first-child]:mt-0">
        <MDXRemote
          source={cleanMarkdown}
          options={{
            mdxOptions: {
              remarkPlugins: [remarkGfm],
              // ponytail: rehype-highlight includes common langs by default, no lowlight needed
              rehypePlugins: [rehypeHighlight],
            },
          }}
          components={{
            img: (props) => {
              // ponytail: SHOW_IMAGES=false, images disabled — return null
              void props;
              return null;
            },
            mark: ({ children }) => (
              <mark className="mx-0.5 inline-block rounded-sm px-1.5 py-0.5 text-[0.9em] font-semibold no-underline shadow-sm">
                {children}
              </mark>
            ),
            a: (props) => {
              const isExternal = props.href?.startsWith("http");
              return (
                <a
                  {...props}
                  target={isExternal ? "_blank" : undefined}
                  rel={isExternal ? "noopener noreferrer" : undefined}
                />
              );
            },
            h1: ({ children }) => {
              const text = getRawText(children);
              const slug = generateSlug(text);
              return (
                <h1 id={slug} className="scroll-mt-24">
                  {children}
                </h1>
              );
            },
            h2: ({ children }) => {
              const text = getRawText(children);
              const slug = generateSlug(text);
              return (
                <h2 id={slug} className="scroll-mt-24">
                  {children}
                </h2>
              );
            },
            h3: ({ children }) => {
              const text = getRawText(children);
              const slug = generateSlug(text);
              return (
                <h3 id={slug} className="scroll-mt-24">
                  {children}
                </h3>
              );
            },
            h4: ({ children }) => {
              const text = getRawText(children);
              const slug = generateSlug(text);
              return (
                <h4 id={slug} className="scroll-mt-24">
                  {children}
                </h4>
              );
            },
          }}
        />
      </div>
    </article>
  );
}
