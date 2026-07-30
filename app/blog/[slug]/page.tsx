import { BlogImage } from "@/components/blog-image";
import { BlogNarrator } from "@/components/blog-narrator";
import { FontSizeToggle } from "@/components/font-size-toggle";
import { TableOfContents } from "@/components/table-of-contents";
import { mirroredSrc } from "@/lib/blog-image-map";
import { siteConfig } from "@/lib/config";
import { i18n } from "@/lib/i18n";
import { getAllBlogPosts, getBlogPost } from "@/lib/md";
import { breadcrumbJsonLd, ogImageUrl, safeJsonLd } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";
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
  // Prefer the build-time mirror so crawlers hit our own origin too.
  const ogImage = post.cover
    ? {
        url: `/_next/image?url=${encodeURIComponent(mirroredSrc(post.cover))}&w=1280&q=75`,
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

// The first images of a post sit just under the cover and table of contents,
// so a reader reaches them almost immediately. Native lazy loading only fires
// once they are nearly in view, which leaves a visible gap on the first scroll;
// starting these with the page hides that without eagerly pulling every image
// in a 20-image post.
const EAGER_IMAGE_COUNT = 2;

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

  // Not every post carries an `updated` frontmatter date, and a few of the
  // older ones carry an unparseable one — the footer line is skipped in both
  // cases rather than rendering "Invalid Date".
  const updated = post.updatedAt ? new Date(post.updatedAt) : null;
  const updatedStr =
    updated && !Number.isNaN(updated.getTime())
      ? updated.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : null;

  function getCrossPost(url: string) {
    if (url.includes("keploy"))
      return { label: "Keploy Blogs", color: "#F97316" };
    if (url.includes("dev.to")) return { label: "DEV.to", color: "#3B49DF" };
    if (url.includes("medium.com"))
      return { label: "Medium", color: "#02B875" };
    return { label: "Hashnode", color: "#2962FF" };
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
      <BlogNarrator articleId="blog-prose" slug={slug} year={d.getFullYear()} />

      {/* Main Content */}
      <div
        id="blog-prose"
        className="prose prose-sm max-w-none [&>*:first-child]:mt-0"
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
            // Markdown `#` renders as <h2>. The post title above is already
            // this page's <h1>, so the six posts that open with `#` were
            // shipping a second one — a document-outline error that heading
            // navigation reports as two top-level sections. It also frees the
            // prose ramp: an in-body h1 had to be sized just under the title,
            // which left no room for the levels beneath it. The id still comes
            // from the same slug, so the table of contents keeps working.
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
                        className="inline-flex items-center font-medium underline underline-offset-2 transition-opacity hover:opacity-80"
                        style={{ color: cp.color }}
                      >
                        {cp.label}
                        <ArrowUpRight className="h-3 w-3" />
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
                  className={`text-muted-foreground blog-scaled-text ${
                    crossPosts.length > 0 ? "blog-footer-gap-tight" : ""
                  }`}
                >
                  {i18n.blog.lastUpdatedOn}: {updatedStr}
                </p>
              )}
            </div>
          )}
        </footer>
      )}
    </article>
  );
}
