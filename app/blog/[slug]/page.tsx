import { BlogImage } from "@/components/blog-image";
import { BlogNarrator } from "@/components/blog-narrator";
import { FontSizeToggle } from "@/components/font-size-toggle";
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
  // Use the post's own thumbnail for link-embed previews when it has one —
  // same image readers already see at the top of the post — falling back
  // to the generated title-card only for older posts without a cover. Only
  // the generated card is guaranteed to actually be 1200x630; real covers
  // vary, so let crawlers measure those themselves rather than claim a
  // fixed size that doesn't match the file.
  // Covers are routed through the Next image optimizer: raw uploads can be
  // ~1MB, and WhatsApp (and some other messengers) silently drop preview
  // thumbnails larger than ~600KB. w must be one of next.config deviceSizes.
  const ogImage = post.cover
    ? {
        url: `/_next/image?url=${encodeURIComponent(post.cover)}&w=1280&q=75`,
        alt: post.title,
      }
    : {
        url: ogImageUrl(post.title, post.brief),
        width: 1200,
        height: 630,
        alt: post.title,
      };
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
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.brief,
      images: [ogImage.url],
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
      {/* Font-size toggle sits where the old cross-post link used to:
          next to the back link on mobile, next to the meta line on
          desktop. That link now lives in the footer of every syndicated
          post ("Also published on ..."). A responsive grid moves the one
          toggle between rows instead of mounting two synced copies. */}
      <div className="mb-6 grid grid-cols-[1fr_auto] gap-x-4 [grid-template-areas:'back_toggle'_'title_title'_'meta_meta'] sm:[grid-template-areas:'back_back'_'title_title'_'meta_toggle']">
        <Link
          href="/blog"
          className="text-muted-foreground hover:text-foreground self-center text-xs transition-colors [grid-area:back]"
        >
          ← {i18n.blog.backLink}
        </Link>
        <div className="self-center justify-self-end [grid-area:toggle]">
          <FontSizeToggle />
        </div>
        <h1 className="text-foreground mt-4 mb-4 text-2xl font-bold tracking-tight [grid-area:title] md:text-3xl">
          {post.title}
        </h1>
        <p className="text-muted-foreground self-center text-xs [grid-area:meta]">
          {dateStr}
          {post.wordCount !== undefined && ` · ${post.wordCount} words`}
          {` · ${post.readingTime} min read`}
        </p>
      </div>

      {/* Cover / thumbnail */}
      {post.cover && (
        <BlogImage src={post.cover} alt={post.title} priority hideCaption />
      )}

      {/* Table of Contents Box */}
      <TableOfContents headings={headings} />

      {/* Read-along narration player */}
      <BlogNarrator articleId="blog-prose" slug={slug} year={d.getFullYear()} />

      {/* Main Content */}
      <div
        id="blog-prose"
        className="prose prose-sm justify-text max-w-none [&>*:first-child]:mt-0"
      >
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
            img: (props) => (
              <BlogImage
                src={typeof props.src === "string" ? props.src : undefined}
                alt={props.alt}
              />
            ),
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

      {(post.tags?.length || post.url) && (
        <footer className="border-border bg-secondary/15 mt-12 rounded-md border p-4 md:p-5">
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground bg-background rounded-sm border px-2.5 py-1 text-xs font-medium transition-colors"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          {post.url && (
            <p
              className={`text-muted-foreground text-xs ${
                post.tags && post.tags.length > 0
                  ? "border-border/60 mt-4 border-t pt-4"
                  : ""
              }`}
            >
              {i18n.blog.alsoPublishedOn}{" "}
              <a
                href={post.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground hover:text-muted-foreground font-medium underline underline-offset-2"
              >
                {post.url.includes("keploy")
                  ? "Keploy Blogs"
                  : post.url.includes("dev.to")
                    ? "DEV.to"
                    : "Hashnode"}
              </a>
              .
            </p>
          )}
        </footer>
      )}
    </article>
  );
}
