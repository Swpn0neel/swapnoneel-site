import { getAllProjects, getProject } from "@/lib/md";
import {
  OG_IMAGE_CONTENT_TYPE,
  OG_IMAGE_SIZE,
  renderOgImage,
} from "@/lib/og-image";
import { notFound } from "next/navigation";

// Without this each project would inherit the generic card from the nearest
// parent segment, putting the same image on all ten.
export const dynamicParams = false;

export function generateStaticParams() {
  return getAllProjects().map((p) => ({ slug: p.meta.slug }));
}

export const alt = "Project";
export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_CONTENT_TYPE;

export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = getProject(slug);
  if (!item) notFound();

  return renderOgImage(item.meta.title, item.meta.description);
}
