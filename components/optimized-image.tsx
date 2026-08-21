"use client";

import Image, { type ImageProps } from "next/image";
import { Fragment, useEffect, useRef, useState } from "react";

interface OptimizedImageProps extends Omit<ImageProps, "loader"> {
  as?: "div" | "span";
  critical?: boolean;
  sourceSets?: Array<{ srcSet: string; type: string; sizes?: string }>;
  showSkeleton?: boolean;
}

export function OptimizedImage({
  as: Wrapper = "div",
  className = "",
  critical = false,
  sourceSets,
  showSkeleton = true,
  alt = "",
  ...imageProps
}: OptimizedImageProps) {
  const isFill = imageProps.fill === true;
  const isPriority = critical || imageProps.priority === true;
  const [loaded, setLoaded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState(false);
  const [shimmerActive, setShimmerActive] = useState(false);
  const [retry, setRetry] = useState(0);
  const shimmerRef = useRef<HTMLSpanElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // If image already cached, mark loaded without waiting for onLoad
  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      setLoaded(true);
    }
  }, [mounted]);

  // Shimmer only when not loaded/error and near viewport
  useEffect(() => {
    const shimmer = shimmerRef.current;
    if (!showSkeleton || !shimmer || loaded || error) {
      setShimmerActive(false);
      return;
    }
    if (!("IntersectionObserver" in window)) {
      setShimmerActive(true);
      return;
    }
    const obs = new IntersectionObserver(
      ([entry]) => setShimmerActive(entry.isIntersecting),
      { rootMargin: "160px 0px" }
    );
    obs.observe(shimmer);
    return () => obs.disconnect();
  }, [loaded, error, showSkeleton]);

  const hasVisible = loaded && !error;

  const imageEl = (
    <Image
      {...imageProps}
      ref={imgRef}
      alt={alt}
      className={`transition-opacity duration-300 ease-out ${
        !mounted || isPriority || loaded ? "opacity-100" : "opacity-0"
      } ${className}`}
      onLoad={(e) => {
        setLoaded(true);
        setError(false);
        (imageProps.onLoad as unknown as (e: unknown) => void)?.(e);
      }}
      onError={(e) => {
        setError(true);
        (imageProps.onError as unknown as (e: unknown) => void)?.(e);
      }}
    />
  );

  return (
    <Wrapper
      className={`relative block overflow-hidden ${isFill ? "size-full" : ""}`}
      aria-busy={!hasVisible && !error}
    >
      {showSkeleton && (
        <span
          ref={shimmerRef}
          aria-hidden="true"
          data-shimmer-active={shimmerActive ? "true" : "false"}
          className={`image-shimmer absolute inset-0 transition-opacity duration-300 ease-out ${
            hasVisible || error ? "pointer-events-none opacity-0" : "opacity-100"
          }`}
        />
      )}

      {sourceSets?.length ? (
        <picture
          key={retry}
          className={isFill ? "relative block size-full" : undefined}
        >
          {sourceSets.map((s) => (
            <source key={s.type} srcSet={s.srcSet} sizes={s.sizes} type={s.type} />
          ))}
          {imageEl}
        </picture>
      ) : (
        <Fragment key={retry}>{imageEl}</Fragment>
      )}

      {error && (
        <span className="bg-secondary/55 text-muted-foreground absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center font-mono text-xs">
          <span>Image unavailable</span>
          <button
            type="button"
            // Remount rather than reassigning `src`. These images sit inside a
            // <picture> whose <source srcSet> is what the browser actually
            // picked, so writing `src` back does not re-run selection and the
            // AVIF that failed is never retried. Bumping the key drops the
            // element and lets the browser choose again from scratch.
            onClick={() => {
              setError(false);
              setLoaded(false);
              setRetry((n) => n + 1);
            }}
            className="border-border bg-background/70 text-foreground hover:bg-background text-2xs rounded-sm border px-2 py-1 transition-colors"
          >
            Try again
          </button>
        </span>
      )}
    </Wrapper>
  );
}
