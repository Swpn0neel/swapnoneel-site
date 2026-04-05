import { getWorkItem, getAllWorkItems, getAllProjects } from "@/lib/md";
import { MDXRemote } from "next-mdx-remote/rsc";
import { notFound } from "next/navigation";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import Link from "next/link";

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
    title: `${item.meta.title} — Swapnoneel Saha`,
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
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          ← work
        </Link>
        <h1 className="text-xl font-semibold mt-4 mb-1">{item.meta.title}</h1>
        <p className="text-xs text-muted-foreground">{item.meta.date}</p>
        {item.meta.description && (
          <p className="text-sm text-muted-foreground mt-2">
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
