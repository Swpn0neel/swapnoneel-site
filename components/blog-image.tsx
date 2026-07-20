import { SmoothImage } from "@/components/smooth-image";
import imageDimensions from "@/lib/image-dimensions.json";

interface BlogImageProps {
  src?: string;
  alt?: string;
  // above-the-fold usage (e.g. post cover) — disables lazy loading
  priority?: boolean;
  // post cover/thumbnail: title already sits right above it, so the alt
  // caption underneath would just repeat the heading
  hideCaption?: boolean;
}

// Hosts configured under images.remotePatterns in next.config.ts. Blog
// markdown embeds images from many arbitrary third-party hosts; those go
// through unoptimized so new hosts never crash a post at render time.
const OPTIMIZED_HOSTS = new Set([
  "cdn.hashnode.com",
  "wp.keploy.io",
  "dev-to-uploads.s3.us-east-2.amazonaws.com",
  "images.pexels.com",
]);

function isOptimizedHost(src: string): boolean {
  try {
    return OPTIMIZED_HOSTS.has(new URL(src).hostname);
  } catch {
    return src.startsWith("/");
  }
}

const DIMENSIONS = imageDimensions as Record<
  string,
  { width: number; height: number }
>;
const FALLBACK_RATIO = 16 / 9;
const ULTRA_HIGH_RESOLUTION_PIXELS = 8_000_000;
const DEFAULT_IMAGE_SIZES = "(max-width: 810px) 100vw, 770px";
const MOBILE_DENSITY_CAP =
  "(max-width: 640px) and (min-resolution: 3.5dppx) 49vw, " +
  "(max-width: 640px) and (min-resolution: 2.5dppx) 65vw, ";

// A 3x/4x phone does not benefit from receiving a 4x rendition of an already
// enormous source. These media conditions keep those outliers near a balanced
// 2x display density while preserving 1x and 2x sharpness. Normal blog images
// retain the default sizing policy unchanged.
const ULTRA_HIGH_RESOLUTION_SIZES = MOBILE_DENSITY_CAP + DEFAULT_IMAGE_SIZES;
const ULTRA_HIGH_RESOLUTION_PREVIEW_SIZES =
  MOBILE_DENSITY_CAP + "(max-width: 640px) 100vw, 640px";

// Dimensions come from scripts/generate-image-dimensions.mjs, precomputed
// at build time (like blur-map.json) so the frame can reserve the image's
// real aspect ratio up front — no layout shift once it loads.
function getAspectRatio(src: string): number {
  const dims = DIMENSIONS[src];
  if (!dims || !dims.width || !dims.height) return FALLBACK_RATIO;
  return dims.width / dims.height;
}

function isUltraHighResolution(src: string): boolean {
  const dims = DIMENSIONS[src];
  return Boolean(
    dims?.width &&
    dims.height &&
    dims.width * dims.height >= ULTRA_HIGH_RESOLUTION_PIXELS
  );
}

function getImageSizes(src: string): string {
  return isUltraHighResolution(src)
    ? ULTRA_HIGH_RESOLUTION_SIZES
    : DEFAULT_IMAGE_SIZES;
}

export function BlogImage({
  src,
  alt = "",
  priority = false,
  hideCaption = false,
}: BlogImageProps) {
  if (!src) return null;

  // span-based markup: markdown images arrive wrapped in a <p>, where
  // <figure>/<div> would be invalid nesting and break hydration.
  // The frame spans full width and its height follows the image's real
  // aspect ratio (precomputed at build time), so the image always covers
  // the whole frame — no caps, no letterboxing, no layout shift.
  return (
    // data-no-narrate: the blog narrator skips this subtree (image + caption)
    <span className="my-6 block" data-no-narrate="">
      <span
        className="border-border bg-secondary/30 relative block w-full overflow-hidden rounded-md border"
        style={{ aspectRatio: getAspectRatio(src) }}
      >
        <SmoothImage
          src={src}
          alt={alt}
          fill
          as="span"
          priority={priority}
          className="object-cover"
          // Real column width: max-w-2xl is 42rem, but the root font-size is
          // 120%, so the container is ~806px and the content ~770px wide.
          // Only ultra-high-resolution sources receive the mobile DPR cap.
          sizes={getImageSizes(src)}
          previewSizes={
            isUltraHighResolution(src)
              ? ULTRA_HIGH_RESOLUTION_PREVIEW_SIZES
              : undefined
          }
          showSkeleton
          progressive
          unoptimized={!isOptimizedHost(src)}
        />
      </span>
      {alt && !hideCaption && (
        <span className="text-muted-foreground mt-2 block text-center font-mono text-xs">
          {alt}
        </span>
      )}
    </span>
  );
}
