"use client";

import Image from "next/image";
import { ComponentProps, useEffect, useRef, useState } from "react";

interface SmoothImageProps extends Omit<
  ComponentProps<typeof Image>,
  "placeholder" | "blurDataURL"
> {
  blurDataURL?: string;
  showSkeleton?: boolean;
  // "span" when rendered in phrasing-content contexts (e.g. inside a
  // markdown paragraph) where a div would break HTML nesting rules.
  as?: "div" | "span";
}

const MAX_AUTOMATIC_RETRIES = 2;
const RETRY_DELAYS = [500, 1200];

function getSourceKey(src: ComponentProps<typeof Image>["src"]): string {
  if (typeof src === "string") return src;
  return "default" in src ? src.default.src : src.src;
}

function getRetrySource(
  src: ComponentProps<typeof Image>["src"],
  attempt: number
): ComponentProps<typeof Image>["src"] {
  if (
    attempt === 0 ||
    typeof src !== "string" ||
    src.startsWith("/") ||
    src.startsWith("data:")
  ) {
    return src;
  }

  try {
    const url = new URL(src);
    // Extra query parameters can invalidate signed image URLs. Remounting the
    // element still retries those; ordinary CDN URLs also get a cache buster
    // so a transient failed browser-cache entry cannot poison every attempt.
    const signedParameters = [
      "hmac",
      "signature",
      "token",
      "expires",
      "x-amz-signature",
    ];
    const isSigned = Array.from(url.searchParams.keys()).some((key) =>
      signedParameters.includes(key.toLowerCase())
    );
    if (!isSigned) url.searchParams.set("__image_retry", String(attempt));
    return url.toString();
  } catch {
    return src;
  }
}

export function SmoothImage(props: SmoothImageProps) {
  // A keyed inner component resets every load/retry state when a reusable
  // surface (such as the project overlay) switches to a different image.
  return <SmoothImageInner key={getSourceKey(props.src)} {...props} />;
}

function SmoothImageInner({
  className = "",
  blurDataURL,
  alt = "",
  showSkeleton = false,
  as: Wrapper = "div",
  onLoad,
  onError,
  ...imageProps
}: SmoothImageProps) {
  const isFill = imageProps.fill === true;
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [fallbackAttempt, setFallbackAttempt] = useState<number | null>(null);
  const [fallbackLoaded, setFallbackLoaded] = useState(false);
  const [fallbackExhausted, setFallbackExhausted] = useState(false);
  const [shimmerActive, setShimmerActive] = useState(false);
  const shimmerRef = useRef<HTMLSpanElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const retryTimeoutRef = useRef<number | null>(null);

  // A `priority` image is the page's LCP candidate, and an element at
  // opacity:0 is not an LCP candidate at all. Gating the reveal on the client
  // `onLoad` therefore deferred LCP to hydration: on a blog post whose cover
  // bytes had arrived in 460ms, LCP landed at 4.3s with 2.2s of it recorded as
  // "element render delay". Priority images paint at full opacity straight
  // from the server HTML; the fade stays for everything off the critical path.
  const isPriority = imageProps.priority === true;
  const hasVisibleImage = loaded || fallbackLoaded;
  const showError = fallbackExhausted && !hasVisibleImage;

  // If the image completed before React hydrated — cached, or just fast — its
  // load event has already fired and will not fire again, so `onLoad` alone
  // would leave the element stuck at opacity:0 for the whole pageview.
  useEffect(() => {
    if (imageRef.current?.complete) setLoaded(true);
  }, []);

  useEffect(() => {
    const shimmer = shimmerRef.current;
    if (!showSkeleton || !shimmer || hasVisibleImage || showError) {
      setShimmerActive(false);
      return;
    }

    if (!("IntersectionObserver" in window)) {
      setShimmerActive(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setShimmerActive(entry.isIntersecting),
      { rootMargin: "160px 0px" }
    );
    observer.observe(shimmer);
    return () => observer.disconnect();
  }, [hasVisibleImage, showError, showSkeleton]);

  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current !== null) {
        window.clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  const beginDirectFallback = () => {
    if (retryTimeoutRef.current !== null) {
      window.clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    setFallbackLoaded(false);
    setFallbackExhausted(false);
    setFallbackAttempt(0);
  };

  const handleError: NonNullable<SmoothImageProps["onError"]> = (event) => {
    setFailed(true);
    // Bypass the optimizer next. This recovers from optimizer/CDN failures and
    // also gives the original host a chance to serve a cached copy directly.
    beginDirectFallback();
    onError?.(event);
  };

  const handleFallbackError: NonNullable<SmoothImageProps["onError"]> = (
    event
  ) => {
    onError?.(event);

    if (fallbackAttempt !== null && fallbackAttempt < MAX_AUTOMATIC_RETRIES) {
      const delay =
        RETRY_DELAYS[fallbackAttempt] ?? RETRY_DELAYS.at(-1) ?? 1200;
      retryTimeoutRef.current = window.setTimeout(() => {
        setFallbackAttempt((attempt) => (attempt === null ? 0 : attempt + 1));
        retryTimeoutRef.current = null;
      }, delay);
      return;
    }

    setFallbackExhausted(true);
  };

  const handleManualRetry = () => {
    if (retryTimeoutRef.current !== null) {
      window.clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    setFallbackLoaded(false);
    setFallbackExhausted(false);
    setFallbackAttempt((attempt) => (attempt === null ? 0 : attempt + 1));
  };

  return (
    <Wrapper
      className={`relative block overflow-hidden ${isFill ? "size-full" : ""}`}
      aria-busy={!hasVisibleImage && !showError}
    >
      {showSkeleton && (
        <span
          ref={shimmerRef}
          aria-hidden="true"
          data-shimmer-active={shimmerActive ? "true" : "false"}
          className={`image-shimmer absolute inset-0 transition-opacity duration-300 ease-out ${
            hasVisibleImage || showError
              ? "pointer-events-none opacity-0"
              : "opacity-100"
          }`}
        />
      )}

      {!failed && (
        <Image
          {...imageProps}
          ref={imageRef}
          alt={alt}
          className={`transition-[opacity,transform,scale] duration-300 ease-out ${
            loaded || isPriority ? "opacity-100" : "opacity-0"
          } ${className}`}
          placeholder={blurDataURL ? "blur" : undefined}
          blurDataURL={blurDataURL}
          onLoad={(event) => {
            setLoaded(true);
            onLoad?.(event);
          }}
          onError={handleError}
        />
      )}

      {fallbackAttempt !== null && !fallbackExhausted && (
        <Image
          {...imageProps}
          key={`direct-${fallbackAttempt}`}
          src={getRetrySource(imageProps.src, fallbackAttempt)}
          alt={alt}
          unoptimized
          fetchPriority={imageProps.priority ? "high" : "auto"}
          className={`transition-[opacity,transform,scale] duration-300 ease-out ${
            fallbackLoaded ? "opacity-100" : "opacity-0"
          } ${className}`}
          onLoad={(event) => {
            setFallbackLoaded(true);
            onLoad?.(event);
          }}
          onError={handleFallbackError}
        />
      )}

      {showError && (
        <Wrapper
          className="bg-secondary/55 text-muted-foreground absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center font-mono text-xs"
          role="status"
          aria-live="polite"
          aria-label={alt || "Image unavailable"}
        >
          <span>Image unavailable</span>
          <button
            type="button"
            onClick={handleManualRetry}
            className="border-border bg-background/70 text-foreground hover:bg-background text-2xs rounded-sm border px-2 py-1 transition-colors"
          >
            Try again
          </button>
        </Wrapper>
      )}
    </Wrapper>
  );
}
