import { SmoothImage } from "@/components/smooth-image";
import { mirroredAspectRatio, mirroredSrc } from "@/lib/blog-image-map";

interface BlogImageProps {
  src?: string;
  alt?: string;
  // above-the-fold usage (e.g. post cover) — preloads at high priority
  priority?: boolean;
  // just below the fold: skip lazy loading so the request starts with the
  // page instead of waiting for the reader to scroll into range
  eager?: boolean;
  // post cover/thumbnail: title already sits right above it, so the alt
  // caption underneath would just repeat the heading
  hideCaption?: boolean;
}

// Hosts configured under images.remotePatterns in next.config.ts. Only
// relevant for images that failed to mirror at build time; blog markdown
// embeds from many arbitrary third-party hosts, and those go through
// unoptimized so a new host never crashes a post at render time.
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

// The rendered column is ~770px: max-w-2xl is 42rem and the root font-size is
// 120%, so the container is ~806px and the content ~770px wide.
//
// The two density conditions keep 3x/4x phones near a balanced 2x rendition.
// Without them a 390px-wide phone requests ~1170px of image for a 390px slot,
// which costs several times the bytes for detail the panel cannot resolve.
const IMAGE_SIZES =
  "(max-width: 640px) and (min-resolution: 3.5dppx) 49vw, " +
  "(max-width: 640px) and (min-resolution: 2.5dppx) 65vw, " +
  "(max-width: 810px) 100vw, 770px";

export function BlogImage({
  src,
  alt = "",
  priority = false,
  eager = false,
  hideCaption = false,
}: BlogImageProps) {
  if (!src) return null;

  const resolvedSrc = mirroredSrc(src);

  return (
    // data-no-narrate: the blog narrator skips this subtree (image + caption)
    <span className="my-6 block" data-no-narrate="">
      <span
        className="border-border bg-secondary/30 relative block w-full overflow-hidden rounded-md border"
        style={{ aspectRatio: mirroredAspectRatio(src) }}
      >
        <SmoothImage
          src={resolvedSrc}
          alt={alt}
          fill
          as="span"
          priority={priority}
          loading={!priority && eager ? "eager" : undefined}
          className="object-cover"
          sizes={IMAGE_SIZES}
          showSkeleton
          unoptimized={!isOptimizedHost(resolvedSrc)}
        />
      </span>
      {alt && !hideCaption && (
        // Scales with the reader's A-/A/A+ choice (--prose-scale, set in
        // globals.css) so captions stay proportional to the article body.
        <span className="text-muted-foreground mt-2 block text-center font-mono text-[calc(0.75rem*var(--prose-scale,1))]">
          {alt}
        </span>
      )}
    </span>
  );
}
