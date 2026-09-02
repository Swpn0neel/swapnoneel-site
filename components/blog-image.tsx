import { StaticImage } from "@/components/static-image";
import { renditionsFor } from "@/lib/blog-image-loader";
import {
  mirroredAspectRatio,
  mirroredDimensions,
  mirroredSrc,
} from "@/lib/blog-image-map";
import { pickRendition } from "@/lib/blog-rendition";

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

// Every blog image is a static file: the mirror script encodes AVIF renditions
// at build time and the WebP mirror sits under them as the <img src>. An image
// whose upstream was dead at build time has no mirror and renders from its
// original URL as a plain <img> — slower, never broken. There is no optimizer
// in this path any more, so no per-image client component either; see
// components/static-image.tsx.
export function BlogImage({
  src,
  alt = "",
  priority = false,
  eager = false,
  hideCaption = false,
}: BlogImageProps) {
  if (!src) return null;

  const resolvedSrc = mirroredSrc(src);
  const renditions = renditionsFor(resolvedSrc);
  const dims = mirroredDimensions(src);
  const sources = renditions
    ? [
        {
          type: "image/avif",
          srcSet: renditions
            .map(
              (width) =>
                `${pickRendition(resolvedSrc, renditions, width)} ${width}w`
            )
            .join(", "),
        },
      ]
    : undefined;

  return (
    // data-no-narrate: the blog narrator skips this subtree (image + caption)
    <span className="my-6 block" data-no-narrate="">
      <span
        className="border-border bg-secondary/30 relative block w-full overflow-hidden rounded-md border"
        style={{ aspectRatio: mirroredAspectRatio(src) }}
      >
        <StaticImage
          as="span"
          src={resolvedSrc}
          alt={alt}
          width={dims?.width}
          height={dims?.height}
          sources={sources}
          sizes={IMAGE_SIZES}
          fill
          className="object-cover"
          priority={priority}
          // The cover is the only preloaded/high-priority image. The first
          // inline image still skips lazy loading but explicitly yields to the
          // cover; later images use native lazy loading.
          loading={eager ? "eager" : "lazy"}
          fetchPriority={eager ? "low" : undefined}
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
