import { ProjectDialog } from "@/components/project-dialog";
import { getAllProjects, getProject } from "@/lib/md";
import type { ProjectMeta } from "@/lib/project-overlay-data";

// A parallel slot matches on path alone, so this pattern must cover project
// URLs and nothing else — which is why projects moved out of /work. Every slug
// it can match is listed below, so the RSC request never 404s and every
// navigation into a project stays client-side.
export const dynamicParams = false;

export function generateStaticParams() {
  return getAllProjects().map((p) => ({ slug: p.meta.slug }));
}

export default async function ProjectModalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = getProject(slug);
  if (!item) return null;

  return <ProjectDialog project={item.meta as unknown as ProjectMeta} />;
}
