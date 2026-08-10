import { CodeBlock } from "@/components/code-block";
import { CopyButtonListener } from "@/components/copy-button-listener";
import { WorkBackLink } from "@/components/work-back-link";
import { siteConfig } from "@/lib/config";
import { getAllProjects, getAllWorkItems, getWorkItem } from "@/lib/md";
import { breadcrumbJsonLd, firstLink, safeJsonLd } from "@/lib/utils";
import { MDXRemote } from "next-mdx-remote/rsc";
import { notFound } from "next/navigation";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";

export const dynamicParams = false;

export async function generateStaticParams() {
  const work = getAllWorkItems();
  const projects = getAllProjects();
  const slugs = new Set<string>();

  for (const item of work) slugs.add(item.meta.slug);
  for (const item of projects) slugs.add(item.meta.slug);

  const params = [];
  for (const slug of slugs) {
    params.push({ slug });
  }

  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = getWorkItem(slug);
  if (!item) return {};
  const url = `https://www.swapnoneel.site/work/${slug}`;
  // No `images` here on purpose: opengraph-image.tsx in this segment supplies
  // the card, and its URL carries the content hash that a hardcoded path would
  // drop — an override here would only cost the cache-busting.
  return {
    title: item.meta.title,
    description: item.meta.description,
    alternates: {
      canonical: `/work/${slug}`,
    },
    openGraph: {
      title: item.meta.title,
      description: item.meta.description,
      url,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: item.meta.title,
      description: item.meta.description,
    },
  };
}

export default async function WorkItemPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = getWorkItem(slug);
  if (!item) notFound();

  const url = `https://www.swapnoneel.site/work/${slug}`;

  return (
    <article className="pb-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd({
            "@context": "https://schema.org",
            "@type": "CreativeWork",
            name: item.meta.title,
            description: item.meta.description,
            url,
            ...(item.meta.link ? { sameAs: firstLink(item.meta.link) } : {}),
            author: {
              "@type": "Person",
              name: siteConfig.person.fullName,
              url: "https://www.swapnoneel.site",
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
              { name: "Work", url: "https://www.swapnoneel.site/work" },
              { name: item.meta.title, url },
            ])
          ),
        }}
      />
      <div className="mb-8">
        <WorkBackLink />
        <h1 className="mt-4 mb-1 text-xl font-semibold text-balance">
          {item.meta.title}
        </h1>
        <p className="text-muted-foreground text-xs">{item.meta.date}</p>
      </div>
      <div id="work-prose" className="prose prose-sm max-w-none">
        <CopyButtonListener articleId="work-prose" />
        <MDXRemote
          source={item.content}
          options={{
            mdxOptions: {
              remarkPlugins: [remarkGfm],
              rehypePlugins: [rehypeHighlight],
            },
          }}
          components={{
            pre: CodeBlock,
            a: ({ href, children, ...props }) => {
              const isExternal =
                href &&
                (href.startsWith("http://") || href.startsWith("https://"));
              return (
                <a
                  href={href}
                  {...(isExternal
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                  {...props}
                >
                  {children}
                </a>
              );
            },
          }}
        />
      </div>
    </article>
  );
}
