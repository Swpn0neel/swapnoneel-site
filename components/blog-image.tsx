import { SmoothImage } from "@/components/smooth-image";
import { renditionsFor } from "@/lib/blog-image-loader";
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
// The two density conditions still hold high-DPR phones below their nominal
// pixel count — a 390px-wide phone asking for the literal ~1170px it wants at
// 3x costs several times the bytes for detail the panel barely resolves. But
// 49/65vw undershot hard enough to be the visible kind of soft: they pinned a
// 3x phone to the 960 candidate for a ~358px slot, i.e. an effective 2.7x.
// 70/85vw reaches the 1280 candidate instead, which is already pre-encoded, so
// this costs bandwidth but no extra build output.
const IMAGE_SIZES =
  "(max-width: 640px) and (min-resolution: 3.5dppx) 70vw, " +
  "(max-width: 640px) and (min-resolution: 2.5dppx) 85vw, " +
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
  // Mirrored images have build-time AVIF siblings and skip the optimizer.
  // Anything that failed to mirror keeps the old /_next/image path.
  const renditions = renditionsFor(resolvedSrc);

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
          // Next emits a <link rel=preload> for eager images as well as
          // priority ones, so a post with two lead images was preloading three
          // at equal priority and letting the below-the-fold pair compete with
          // the cover — which is the LCP element. The hints split them: the
          // cover is the one thing worth the bandwidth up front (Lighthouse
          // was flagging its preload as missing fetchpriority), the lead
          // images still skip lazy loading but yield to it.
          fetchPriority={priority ? "high" : eager ? "low" : undefined}
          className="object-cover"
          sizes={IMAGE_SIZES}
          // Ignored on the static path (the loader picks a pre-encoded file),
          // and still needed for images that fall back to the optimizer: it
          // opts out of Next's default 75, which arrives at the AVIF encoder as
          // q55. Must be listed in images.qualities in next.config.ts.
          quality={90}
          renditions={renditions}
          showSkeleton
          unoptimized={!renditions && !isOptimizedHost(resolvedSrc)}
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
