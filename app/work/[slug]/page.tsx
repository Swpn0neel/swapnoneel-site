import { i18n } from "@/lib/i18n";
import { getAllProjects, getAllWorkItems, getWorkItem } from "@/lib/md";
import { MDXRemote } from "next-mdx-remote/rsc";
import Link from "next/link";
import { notFound } from "next/navigation";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";

export const dynamicParams = false;

export async function generateStaticParams() {
  const work = getAllWorkItems();
  const projects = getAllProjects();
  const slugs = new Set([
    ...work.map((p) => p.meta.slug),
    ...projects.map((p) => p.meta.slug),
  ]);
  return Array.from(slugs).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = getWorkItem(slug);
  if (!item) return {};
  return {
    title: item.meta.title,
    description: item.meta.description,
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

  return (
    <article className="pb-16">
      <div className="mb-8">
        <Link
          href="/work"
          className="text-muted-foreground hover:text-foreground text-xs transition-colors"
        >
          ← {i18n.work.otherExperience.backLink}
        </Link>
        <h1 className="mt-4 mb-1 text-xl font-semibold">{item.meta.title}</h1>
        <p className="text-muted-foreground text-xs">{item.meta.date}</p>
        {item.meta.description && (
          <p className="text-muted-foreground mt-2 text-sm">
            {item.meta.description}
          </p>
        )}
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
