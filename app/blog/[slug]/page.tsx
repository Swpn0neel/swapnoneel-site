import { siteConfig } from "@/lib/config";
import { getAllBlogPosts, getBlogPost } from "@/lib/md";
import { i18n } from "@/lib/i18n";
import { safeJsonLd } from "@/lib/utils";
import { MDXRemote } from "next-mdx-remote/rsc";
import Link from "next/link";
import { notFound } from "next/navigation";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import { ImageWithSkeleton } from "@/components/image-with-skeleton";
import { TableOfContents } from "@/components/table-of-contents";

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

const generateSlug = (text: string) => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
};

const getRawText = (node: any): string => {
  if (!node) return "";
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(getRawText).join("");
  if (node.props && node.props.children) return getRawText(node.props.children);
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

  const SHOW_IMAGES = false; // Set to true to re-enable covers and article body images!

  const d = new Date(post.publishedAt);
  const dateStr = d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const cleanMarkdown = (post.content?.markdown || "")
    .replace(/<mark>(.*?)<\/mark>\s*\((https?:\/\/.*?)\)/gi, "[<mark>$1</mark>]($2)")
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
      <div className="mb-6">
        <Link
          href="/blog"
          className="text-muted-foreground hover:text-foreground text-xs transition-colors"
        >
          ← {i18n.blog.backLink}
        </Link>



        <h1 className="mt-4 mb-2 text-2xl md:text-3xl font-bold tracking-tight text-foreground">
          {post.title}
        </h1>
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

      {/* Table of Contents Box */}
      <TableOfContents headings={headings} />

      {/* Main Content */}
      <div className="prose prose-sm max-w-none [&>*:first-child]:mt-0">
        <MDXRemote
          source={cleanMarkdown}
          options={{
            mdxOptions: {
              remarkPlugins: [remarkGfm],
              rehypePlugins: [rehypeHighlight],
            },
          }}
          components={{
            img: (props) => {
              if (!SHOW_IMAGES) return null;
              return (
                <ImageWithSkeleton
                  src={props.src || ""}
                  alt={props.alt || ""}
                  className="mx-auto max-w-full h-auto rounded-lg border border-border transition-all duration-300 hover:scale-[1.005]"
                  wrapperClassName="my-6 rounded-lg"
                  loading="eager"
                />
              );
            },
            mark: ({ children }) => (
              <mark className="bg-white! text-black! dark:bg-white! dark:text-black! font-semibold px-1.5 py-0.5 rounded-sm mx-0.5 shadow-sm no-underline inline-block text-[0.9em]">
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
