"use client";

import { registerProgressiveImage } from "@/components/progressive-image-listener";
import Image, { type ImageProps } from "next/image";
import { useCallback, useEffect, useRef } from "react";

interface ProgressiveImageProps extends Omit<
  ImageProps,
  "loader" | "onError" | "onLoad" | "placeholder" | "blurDataURL"
> {
  as?: "div" | "span";
  critical?: boolean;
  sourceSets?: Array<{ sizes?: string; srcSet: string; type: string }>;
}

/**
 * Server-first image markup. Its own hydrated shell registers with the shared
 * observer, so the normal path does not depend on a document-wide DOM scan.
 * Images remain opaque until that client code runs, preserving no-JS visibility.
 */
export function ProgressiveImage({
  alt,
  as: Wrapper = "div",
  className = "",
  critical = false,
  sourceSets,
  ...imageProps
}: ProgressiveImageProps) {
  const shellRef = useRef<HTMLElement>(null);
  const setShellRef = useCallback(
    (node: HTMLDivElement | HTMLSpanElement | null) => {
      shellRef.current = node;
    },
    []
  );

  useEffect(() => {
    if (!shellRef.current) return;
    return registerProgressiveImage(shellRef.current);
  }, []);

  const image = (
    <Image
      {...imageProps}
      alt={alt}
      className={`progressive-image__image ${className}`}
    />
  );

  return (
    <Wrapper
      ref={setShellRef}
      // The delegated listener owns the runtime data-image-* attributes. The
      // root listener can hydrate before a streamed page subtree, so those
      // attributes may already describe the real image state when React
      // reaches this server markup. Limit the exemption to this exact node;
      // the rest of the image subtree is still checked normally.
      suppressHydrationWarning
      data-progressive-image
      data-progressive-priority={
        critical || imageProps.priority ? "true" : undefined
      }
      className={`progressive-image relative block overflow-hidden ${
        imageProps.fill ? "size-full" : ""
      }`}
    >
      <span
        aria-hidden="true"
        // data-shimmer-active is updated by the same delegated listener and
        // can legitimately differ by the time this streamed node hydrates.
        suppressHydrationWarning
        data-image-shimmer
        data-shimmer-active="false"
        className="image-shimmer progressive-image__shimmer absolute inset-0 transition-opacity duration-300 ease-out"
      />
      {sourceSets?.length ? (
        <picture
          className={imageProps.fill ? "relative block size-full" : undefined}
        >
          {sourceSets.map((source) => (
            <source key={source.type} {...source} />
          ))}
          {image}
        </picture>
      ) : (
        image
      )}
    </Wrapper>
  );
}
