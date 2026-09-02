import type { CSSProperties } from "react";

export interface StaticImageSource {
  type: string;
  srcSet: string;
}

interface StaticImageProps {
  /** The <img src> — the widest WebP or, for an unmirrored image, the original. */
  src: string;
  alt: string;
  /** Intrinsic size for the <img> so the box is known before any CSS applies. */
  width?: number;
  height?: number;
  /** <source> entries in preference order; browsers stop at the first they decode. */
  sources?: StaticImageSource[];
  sizes?: string;
  /** Lazy unless given, as next/image was; priority and preload force eager. */
  loading?: "eager" | "lazy";
  fetchPriority?: "high" | "low" | "auto";
  decoding?: "async" | "sync" | "auto";
  /**
   * The LCP candidate: preloaded from <head>, eager, high priority, and never
   * hidden behind the fade-in below — the first paint must not wait on a class.
   */
  priority?: boolean;
  /** Preload without the priority override — for eager images in the first viewport. */
  preload?: boolean;
  /** Stretch the image over the frame; the frame's own size is the box. */
  fill?: boolean;
  /** Applied to the <img>. */
  className?: string;
  /** Applied to the frame element. */
  frameClassName?: string;
  frameStyle?: CSSProperties;
  as?: "div" | "span";
  /** Tiny inline placeholder painted under the image until it arrives. */
  blurDataURL?: string;
  showSkeleton?: boolean;
}

/**
 * Every image on the site, rendered on the server with no component state.
 *
 * This replaced a client component that wrapped next/image with four pieces of
 * state and an IntersectionObserver per image. None of that needed React: the
 * renditions are all encoded at build time (scripts/mirror-blog-images.mjs,
 * generate-project-images.mjs, generate-ui-images.mjs), so the browser can be
 * handed a <picture> and left alone. The one thing that does need JavaScript —
 * knowing when a given image has loaded, to fade it in and retire its shimmer
 * — is done once for the whole document by ImageLoadListener, which writes
 * `data-image-state` onto the frame this component renders. The CSS keyed on
 * that attribute lives in app/styles/components.css.
 *
 * Without JavaScript nothing is ever hidden: the frame ships with no state, the
 * image paints as it arrives, and the shimmer sits behind it as a plain tint.
 */
export function StaticImage({
  src,
  alt,
  width,
  height,
  sources,
  sizes,
  loading,
  fetchPriority,
  decoding = "async",
  priority = false,
  preload = false,
  fill = false,
  className = "",
  frameClassName = "",
  frameStyle,
  as: Frame = "div",
  blurDataURL,
  showSkeleton = true,
}: StaticImageProps) {
  const preloadSource = sources?.[0];
  const shouldPreload = priority || preload;
  const resolvedLoading = shouldPreload ? "eager" : (loading ?? "lazy");
  // The widest candidate of the preferred source. Browsers that understand
  // imagesrcset ignore href; the rest preload this and, lacking <picture>
  // support for the same format, would have downloaded it anyway.
  const preloadHref = preloadSource
    ? preloadSource.srcSet.split(",").pop()?.trim().split(/\s+/)[0]
    : src;

  return (
    <Frame
      data-image-frame=""
      data-image-priority={priority ? "" : undefined}
      className={`relative block overflow-hidden ${fill ? "size-full" : ""} ${frameClassName}`}
      style={
        blurDataURL
          ? {
              ...frameStyle,
              backgroundImage: `url("${blurDataURL}")`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : frameStyle
      }
    >
      {showSkeleton && (
        <span aria-hidden="true" className="image-shimmer absolute inset-0" />
      )}
      {shouldPreload && (
        // React hoists this into <head>. The `type` lets a browser that cannot
        // decode AVIF skip the preload rather than waste it.
        <link
          rel="preload"
          as="image"
          href={preloadHref}
          imageSrcSet={preloadSource?.srcSet}
          imageSizes={preloadSource ? sizes : undefined}
          type={preloadSource?.type}
          fetchPriority={priority ? "high" : undefined}
        />
      )}
      <picture className="contents">
        {sources?.map((source) => (
          <source
            key={source.type}
            type={source.type}
            srcSet={source.srcSet}
            sizes={sizes}
          />
        ))}
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          sizes={sources?.length ? undefined : sizes}
          loading={resolvedLoading}
          fetchPriority={priority ? "high" : fetchPriority}
          decoding={decoding}
          className={`${fill ? "absolute inset-0 h-full w-full" : ""} ${className}`}
        />
      </picture>
      {/* Shown only once the listener has marked the frame as failed. The
          activation is handled by ImageLoadListener (click, Enter, Space),
          which remounts the <picture> so the browser re-runs source selection
          from scratch. A span with a button role rather than a <button>: frames
          sit inside the profile-photo <button> and inside card links, and a
          <button> nested in either is invalid HTML — the parser breaks it out,
          and hydration then fails on the mismatch. */}
      <span className="image-frame__error bg-secondary/55 text-muted-foreground absolute inset-0 flex-col items-center justify-center gap-2 p-4 text-center font-mono text-xs">
        <span>Image unavailable</span>
        <span
          role="button"
          tabIndex={0}
          data-image-retry=""
          className="border-border bg-background/70 text-foreground hover:bg-background text-2xs cursor-pointer rounded-sm border px-2 py-1 transition-colors"
        >
          Try again
        </span>
      </span>
    </Frame>
  );
}
