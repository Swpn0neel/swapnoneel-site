import { getAllBlogPosts, getBlogPost } from "@/lib/md";
import {
  OG_IMAGE_CONTENT_TYPE,
  OG_IMAGE_SIZE,
  renderOgImage,
} from "@/lib/og-image";
import { notFound } from "next/navigation";

// Posts with a cover use it as their card (see generateMetadata in page.tsx),
// and that wins over this file-convention image — so rendering one for them
// produced 49 PNGs no page ever references. Only the cover-less ones are built
// here, which is what keeps the next post without a cover from falling back to
// the generic /blog card inherited from the parent segment.
export const dynamicParams = false;

export async function generateStaticParams() {
  const posts = await getAllBlogPosts();
  return posts
    .filter((post) => !post.cover)
    .map((post) => ({ slug: post.slug }));
}

export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_CONTENT_TYPE;

// Per-image alt, so the card is described by its post rather than by the word
// "Blog" the static export was giving every one of them.
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
