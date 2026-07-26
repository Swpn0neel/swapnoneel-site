import { siteConfig } from "@/lib/config";
import { i18n } from "@/lib/i18n";
import { getAllProjects, getAllWorkItems, getWorkItem } from "@/lib/md";
import { breadcrumbJsonLd, firstLink, ogImageUrl, safeJsonLd } from "@/lib/utils";
import { MDXRemote } from "next-mdx-remote/rsc";
import Link from "next/link";
import { notFound } from "next/navigation";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";

export const dynamicParams = false;
export const revalidate = 3600;

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
  const ogImage = ogImageUrl(item.meta.title, item.meta.description);
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
      images: [
        { url: ogImage, width: 1200, height: 630, alt: item.meta.title },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: item.meta.title,
      description: item.meta.description,
      images: [ogImage],
    },
  };
}

export default async function WorkItemPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { slug } = await params;
  const { from } = await searchParams;
  const item = getWorkItem(slug);
  if (!item) notFound();

  const backHref = from === "home" ? "/" : "/work";
  const backLabel = from === "home" ? "home" : i18n.work.otherExperience.backLink;

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
        <Link
          href={backHref}
          className="text-muted-foreground hover:text-foreground text-xs transition-colors"
        >
          ← {backLabel}
        </Link>
        <h1 className="mt-4 mb-1 text-xl font-semibold">{item.meta.title}</h1>
        <p className="text-muted-foreground text-xs">{item.meta.date}</p>
      </div>
      <div className="prose prose-sm max-w-none">
        <MDXRemote
          source={item.content}
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
