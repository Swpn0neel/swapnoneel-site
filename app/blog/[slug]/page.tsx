import { BlogImage } from "@/components/blog-image";
import { BlogNarrator } from "@/components/blog-narrator";
import { CodeBlock } from "@/components/code-block";
import { CopyButtonListener } from "@/components/copy-button-listener";
import { FontSizeToggle } from "@/components/font-size-toggle";
import { RelatedPosts } from "@/components/related-posts";
import { TableOfContents } from "@/components/table-of-contents";
import { mirroredSrc } from "@/lib/blog-image-map";
import { siteConfig } from "@/lib/config";
import { i18n } from "@/lib/i18n";
import { getAllBlogPosts, getBlogPost } from "@/lib/md";
import { getRawText } from "@/lib/mdx-text";
import { getRelatedPosts } from "@/lib/related-posts";
import { breadcrumbJsonLd, safeJsonLd } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";
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
  const url = `https://www.swapnoneel.site/blog/${slug}`;
  const ogImage = post.cover
    ? {
      url: `/_next/image?url=${encodeURIComponent(mirroredSrc(post.cover))}&w=1280&q=75`,
      alt: post.title,
    }
    : null;
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
      ...(ogImage ? { images: [ogImage] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.brief,
      ...(ogImage ? { images: [ogImage.url] } : {}),
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

// The cover is the sole high-priority/preloaded image. Only the first inline
// image starts eagerly (at low fetch priority); every later image stays native
// lazy so it cannot compete with article LCP.
const EAGER_IMAGE_COUNT = 1;

function extractLeadImageSources(markdown: string): Set<string> {
  const regex = /!\[[^\]]*\]\((\S+?)\)/g;
  const sources = new Set<string>();
  let match;
  while ((match = regex.exec(markdown)) && sources.size < EAGER_IMAGE_COUNT) {
    sources.add(match[1]);
  }
  return sources;
}

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

  const updated = post.updatedAt ? new Date(post.updatedAt) : null;
  const updatedStr =
    updated && !Number.isNaN(updated.getTime())
      ? updated.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
      : null;

  // When adding a new cross-post brand, define TWO colors (light and dark mode):
  // 1. Light theme (`text-[#...]`): Darker shade (e.g. 700-level) with >= 4.5:1 contrast against #ffffff
  // 2. Dark theme (`dark:text-[#...]`): Lighter tint (e.g. 400-level) with >= 4.5:1 contrast against #0a0a0a
  // This ensures WCAG AA compliance and maintains a 100/100 Lighthouse Accessibility score.
  function getCrossPost(url: string) {
    if (url.includes("keploy"))
      return {
        label: "Keploy Blogs",
        className: "text-[#C2410C] dark:text-[#FB923C]",
      };
    if (url.includes("dev.to"))
      return {
        label: "DEV.to",
        className: "text-[#3B49DF] dark:text-[#818CF8]",
      };
    if (url.includes("medium.com"))
      return {
        label: "Medium",
        className: "text-[#047857] dark:text-[#34D399]",
      };
    if (url.includes("substack.com"))
      return {
        label: "Substack",
        className: "text-[#C2410C] dark:text-[#FB923C]",
      };
    if (url.includes("getmaxim.ai") || url.includes("bifrost"))
      return {
        label: "Maxim AI",
        className: "text-[#0F766E] dark:text-[#2DD4BF]",
      };
    return {
      label: "Hashnode",
      className: "text-[#1D4ED8] dark:text-[#60A5FA]",
    };
  }

  const crossPosts = (post.urls ?? []).map((url) => ({
    url,
    ...getCrossPost(url),
  }));

  const cleanMarkdown = (post.content?.markdown || "")
    .replace(
      /<mark>(.*?)<\/mark>\s*\((https?:\/\/.*?)\)/gi,
      "[<mark>$1</mark>]($2)"
    )
    .replace(/(!\[.*?\]\(([^)]*?))\s+align=".*?"\)/g, "$1)")
    .replace(/%%?\[.*?\]/g, "");

  const headings = extractHeadings(cleanMarkdown);
  const leadImages = extractLeadImageSources(cleanMarkdown);
  const relatedPosts = getRelatedPosts(slug);

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
              post.cover || "https://www.swapnoneel.site/blog/opengraph-image",
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
        <h1 className="blog-title text-foreground mt-4 mb-4 font-bold tracking-tight text-balance [grid-area:title]">
          {post.title}
        </h1>
        <p className="text-muted-foreground blog-scaled-text self-center [grid-area:meta]">
          {dateStr}
          {post.wordCount !== undefined && ` · ${post.wordCount} words`}
          {post.readingTime !== undefined && ` · ${post.readingTime} min read`}
        </p>
      </div>

      {/* Cover / thumbnail */}
      {post.cover && (
        <BlogImage src={post.cover} alt={post.title} priority hideCaption />
      )}

      {/* Table of Contents Box */}
      <TableOfContents headings={headings} />

      {/* Read-along narration player */}
      <BlogNarrator
        articleId="blog-prose"
        slug={slug}
        year={d.getFullYear()}
        initialWordCount={post.wordCount}
      />

      {/* Main Content */}
      <div
        id="blog-prose"
        className="prose prose-sm max-w-none [&>*:first-child]:mt-0"
      >
        <CopyButtonListener articleId="blog-prose" />
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
            pre: CodeBlock,
            img: (props) => {
              const src = typeof props.src === "string" ? props.src : undefined;
              return (
                <BlogImage
                  src={src}
                  alt={props.alt}
                  eager={Boolean(src && leadImages.has(src))}
                />
              );
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
                <h2 id={slug} className="scroll-mt-24">
                  {children}
                </h2>
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

      {(post.tags?.length || crossPosts.length > 0 || updatedStr) && (
        <footer className="blog-footer-gap space-y-4">
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground bg-background blog-scaled-text rounded-sm border px-2.5 py-1 font-medium transition-colors"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          {/* Syndication + updated date read as one block, so they sit tight
              together and take the tag row's breathing gap as a pair. */}
          {(crossPosts.length > 0 || updatedStr) && (
            <div className="blog-footer-gap">
              {crossPosts.length > 0 && (
                <p className="text-muted-foreground blog-scaled-text">
                  {i18n.blog.alsoPublishedOn}{" "}
                  {crossPosts.map((cp, i) => (
                    <span key={cp.url}>
                      <a
                        href={cp.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center font-medium underline underline-offset-2 transition-opacity hover:opacity-80 ${cp.className}`}
                      >
                        {cp.label}
                        {<ArrowUpRight className="h-3 w-3" />}
                      </a>
                      {i < crossPosts.length - 2 && (
                        <span className="text-muted-foreground">{", "}</span>
                      )}
                      {i === crossPosts.length - 2 && (
                        <span className="text-muted-foreground">{" and "}</span>
                      )}
                    </span>
                  ))}
                </p>
              )}
              {updatedStr && (
                <p
                  className={`text-muted-foreground blog-scaled-text ${crossPosts.length > 0 ? "blog-footer-gap-tight" : ""
                    }`}
                >
                  {i18n.blog.lastUpdatedOn}: {updatedStr}
                </p>
              )}
            </div>
          )}
        </footer>
      )}

      <RelatedPosts posts={relatedPosts} />
    </article>
  );
}
