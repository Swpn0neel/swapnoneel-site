import { getAllProjects, getAllWorkItems, getWorkItem } from "@/lib/md";
import {
  OG_IMAGE_CONTENT_TYPE,
  OG_IMAGE_SIZE,
  renderOgImage,
} from "@/lib/og-image";
import { notFound } from "next/navigation";

// Every work item and project gets its own card, rendered at build time. The
// parent /work card would otherwise be inherited here, putting the same generic
// "Work" image on all 15 detail pages.
export const dynamicParams = false;

export function generateStaticParams() {
  const slugs = new Set<string>();
  for (const item of getAllWorkItems()) slugs.add(item.meta.slug);
  for (const item of getAllProjects()) slugs.add(item.meta.slug);
  return [...slugs].map((slug) => ({ slug }));
}

export async function generateImageMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return [
    {
      id: "card",
      alt: getWorkItem(slug)?.meta.title ?? "Work",
      size: OG_IMAGE_SIZE,
      contentType: OG_IMAGE_CONTENT_TYPE,
    },
  ];
}

export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = getWorkItem(slug);
  if (!item) notFound();

  return renderOgImage(item.meta.title, item.meta.description);
}
