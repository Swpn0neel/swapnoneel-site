import { CodeBlock } from "@/components/code-block";
import { CopyButtonListener } from "@/components/copy-button-listener";
import { ProjectCover } from "@/components/project-card";
import { WorkBackLink } from "@/components/work-back-link";
import { siteConfig } from "@/lib/config";
import { getAllProjects, getProject } from "@/lib/md";
import { breadcrumbJsonLd, firstLink, safeJsonLd } from "@/lib/utils";
import { MDXRemote } from "next-mdx-remote/rsc";
import { notFound } from "next/navigation";
import rehypePrettyCode from "rehype-pretty-code";
import remarkGfm from "remark-gfm";

const SITE_URL = "https://www.swapnoneel.site";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllProjects().map((project) => ({ slug: project.meta.slug }));
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
  const projectLink = firstLink(item.meta.link);
  const repositoryLink = item.meta.repo;
  const isFigmaLink = projectLink?.includes("figma.com/") ?? false;

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
            ...(projectLink ? { sameAs: projectLink } : {}),
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

      <div className="mb-5">
        <WorkBackLink />
        <div className="mt-4 flex items-center gap-4">
          <h1 className="min-w-0 flex-1 text-xl font-semibold text-balance">
            {item.meta.title}
          </h1>
          <div className="flex shrink-0 items-center gap-2">
            {repositoryLink && (
              <a
                href={repositoryLink}
                target="_blank"
                rel="noopener noreferrer"
                className="border-border bg-background text-muted-foreground hover:border-foreground/25 hover:text-foreground flex size-10 items-center justify-center rounded-full border transition-colors"
                aria-label={`View ${item.meta.title} source code on GitHub`}
              >
                <svg
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3.28-.36 6.72-1.61 6.72-7a5.4 5.4 0 0 0-1.5-3.75 5.07 5.07 0 0 0-.09-3.5S17.95-.12 15 1.73a13.38 13.38 0 0 0-7 0C5.05-.12 3.87.25 3.87.25a5.07 5.07 0 0 0-.09 3.5A5.4 5.4 0 0 0 2.28 7.5c0 5.38 3.44 6.64 6.72 7A4.8 4.8 0 0 0 8 18v4" />
                  <path d="M9 18c-4.51 2-5-2-7-2" />
                </svg>
              </a>
            )}
            {projectLink && (
              <a
                href={projectLink}
                target="_blank"
                rel="noopener noreferrer"
                className="border-border bg-background text-muted-foreground hover:border-foreground/25 hover:text-foreground flex size-10 items-center justify-center rounded-full border transition-colors"
                aria-label={
                  isFigmaLink
                    ? `Open ${item.meta.title} in Figma`
                    : `Visit ${item.meta.title} website`
                }
              >
                {isFigmaLink ? (
                  <svg
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 3h3a3 3 0 0 1 0 6h-3V3Z" />
                    <path d="M9 3h3v6H9a3 3 0 0 1 0-6Z" />
                    <path d="M9 9h3v6H9a3 3 0 0 1 0-6Z" />
                    <path d="M15 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z" />
                    <path d="M9 15h3v3a3 3 0 1 1-3-3Z" />
                  </svg>
                ) : (
                  <svg
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="9" />
                    <path d="M3 12h18" />
                    <path d="M12 3a14.5 14.5 0 0 1 0 18" />
                    <path d="M12 3a14.5 14.5 0 0 0 0 18" />
                  </svg>
                )}
              </a>
            )}
          </div>
        </div>
      </div>

      {item.meta.cover && (
        <div className="border-border mb-8 overflow-hidden rounded-md border">
          <ProjectCover
            cover={item.meta.cover}
            alt={`${item.meta.title} project preview`}
            sizes="(max-width: 672px) calc(100vw - 2rem), 640px"
            priority
          />
        </div>
      )}

      <div id="project-prose" className="prose prose-sm max-w-none">
        <CopyButtonListener articleId="project-prose" />
        <MDXRemote
          source={item.content}
          options={{
            mdxOptions: {
              remarkPlugins: [remarkGfm],
              rehypePlugins: [
                [
                  rehypePrettyCode,
                  {
                    theme: { light: "github-light", dark: "github-dark" },
                    keepBackground: false,
                  },
                ],
              ],
            },
          }}
          components={{
            pre: CodeBlock,
            h1: ({ children }) => <h2>{children}</h2>,
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
