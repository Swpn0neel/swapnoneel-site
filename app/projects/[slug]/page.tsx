import { ProjectDetailContent } from "@/components/project-detail-content";
import { BackLink } from "@/components/back-link";
import { siteConfig } from "@/lib/config";
import { i18n } from "@/lib/i18n";
import { getAllProjects, getProject } from "@/lib/md";
import type { ProjectMeta } from "@/lib/project-overlay-data";
import { breadcrumbJsonLd, firstLink, safeJsonLd } from "@/lib/utils";
import { notFound } from "next/navigation";

// Projects live here rather than under /work so the dialog's intercepting route
// (app/@modal/(.)projects/[slug]) matches project URLs and nothing else. While
// both shared /work/[slug], the slot matched the career entries and
// /work/others too — a parallel slot matches on path alone — which 404'd their
// RSC request and forced a full document reload. /work/[slug] redirects the old
// project URLs here.
const SITE_URL = "https://www.swapnoneel.site";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllProjects().map((p) => ({ slug: p.meta.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = getProject(slug);
  if (!item) return {};
  const url = `${SITE_URL}/projects/${slug}`;
  return {
    title: item.meta.title,
    description: item.meta.description,
    alternates: { canonical: `/projects/${slug}` },
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

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = getProject(slug);
  if (!item) notFound();

  const url = `${SITE_URL}/projects/${slug}`;

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
              url: SITE_URL,
            },
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd(
            breadcrumbJsonLd([
              { name: "Home", url: SITE_URL },
              { name: "Work", url: `${SITE_URL}/work` },
              { name: item.meta.title, url },
            ])
          ),
        }}
      />
      <div className="mb-4">
        <BackLink href="/work" label={i18n.work.otherExperience.backLink} />
      </div>
      <div className="overflow-hidden rounded-md border">
        <ProjectDetailContent
          project={item.meta as unknown as ProjectMeta}
        />
      </div>
    </article>
  );
}
