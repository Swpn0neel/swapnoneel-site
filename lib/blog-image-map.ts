import blogImages from "@/lib/blog-images.json";

// scripts/mirror-blog-images.mjs downloads every image referenced by a post at
// build time, caps it at the widest deviceSize and stores it under
// public/blog-img. Serving from our own origin removes the third-party round
// trip that dominated image latency (those hosts answered in ~1s, before the
// optimizer had even started transcoding), and the precomputed dimensions let
// the frame reserve each image's real aspect ratio up front (no CLS).
const MIRRORED = blogImages as Record<
  string,
  { local: string; width: number; height: number }
>;

const FALLBACK_RATIO = 16 / 9;

// Images that failed to mirror (dead upstream URLs) keep rendering from their
// original location — slower, but never broken.
export function mirroredSrc(src: string): string {
  return MIRRORED[src]?.local ?? src;
}

export function mirroredAspectRatio(src: string): number {
  const dims = MIRRORED[src];
  if (!dims?.width || !dims.height) return FALLBACK_RATIO;
  return dims.width / dims.height;
}

// Intrinsic size for the <img> attributes. Null for images that did not mirror.
export function mirroredDimensions(
  src: string
): { width: number; height: number } | null {
  const dims = MIRRORED[src];
  if (!dims?.width || !dims.height) return null;
  return { width: dims.width, height: dims.height };
}
