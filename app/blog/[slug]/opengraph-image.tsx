import { getAllBlogPosts, getBlogPost } from "@/lib/md";
import {
  OG_IMAGE_CONTENT_TYPE,
  OG_IMAGE_SIZE,
  renderOgImage,
} from "@/lib/og-image";
import { notFound } from "next/navigation";

// Posts with a cover use it as their card (see generateMetadata in page.tsx), so
// only the cover-less ones are rendered here — every post today has a cover, and
// this is what keeps the next one that does not from falling back to the generic
// /blog card inherited from the parent segment.
export const dynamicParams = false;

export async function generateStaticParams() {
  const posts = await getAllBlogPosts();
  return posts
    .filter((post) => !post.cover)
    .map((post) => ({ slug: post.slug }));
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
      alt: getBlogPost(slug)?.title ?? "Blog",
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
  const post = getBlogPost(slug);
  if (!post || post.cover) notFound();

  return renderOgImage(post.title, post.brief);
}
