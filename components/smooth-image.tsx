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
  // Two-stage loading for fill images: fetch a lightweight, readable preview
  // first, then start the final image as soon as the preview has painted.
  progressive?: boolean;
  // Optional responsive policy for the preview stage. Blog images use this to
  // cap only ultra-high-resolution mobile sources without changing the normal
  // progressive-image path.
  previewSizes?: string;
}

// The preview is intentionally close to the rendered blog-column width. At
// ~640px / q60 it remains clean on a 1x display while still being far cheaper
// than the 1024px final image; high-density screens select a sharper candidate
// automatically from the generated srcset.
const PREVIEW_SIZES = "(max-width: 640px) 100vw, 640px";
const PREVIEW_QUALITY = 60;
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
  progressive = false,
  previewSizes = PREVIEW_SIZES,
  onLoad,
  onError,
  ...imageProps
}: SmoothImageProps) {
  const isFill = imageProps.fill === true;
  const twoStage = progressive && !imageProps.unoptimized && isFill;
  const [previewLoaded, setPreviewLoaded] = useState(false);
  const [previewFailed, setPreviewFailed] = useState(false);
  const [mountFinal, setMountFinal] = useState(false);
  const [finalLoaded, setFinalLoaded] = useState(false);
  const [finalFailed, setFinalFailed] = useState(false);
  const [fallbackAttempt, setFallbackAttempt] = useState<number | null>(null);
  const [fallbackLoaded, setFallbackLoaded] = useState(false);
  const [fallbackExhausted, setFallbackExhausted] = useState(false);
  const retryTimeoutRef = useRef<number | null>(null);

  const hasVisibleImage = previewLoaded || finalLoaded || fallbackLoaded;
  const showError = fallbackExhausted && !hasVisibleImage;

  // Give the clean preview one paint of its own, then start the final request
  // immediately. This keeps the progressive reveal perceptible without the
  // old multi-second idle delay.
  useEffect(() => {
    if (!twoStage || !previewLoaded || mountFinal) return;

    let secondFrame = 0;
    const firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => setMountFinal(true));
    });

    return () => {
      window.cancelAnimationFrame(firstFrame);
      if (secondFrame) window.cancelAnimationFrame(secondFrame);
    };
  }, [mountFinal, previewLoaded, twoStage]);

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

  const handlePreviewError: NonNullable<SmoothImageProps["onError"]> = (
    event
  ) => {
    setPreviewFailed(true);
    if (twoStage) {
      // The final optimized request may still succeed even when one generated
      // preview variant has failed.
      setMountFinal(true);
    } else {
      beginDirectFallback();
    }
    onError?.(event);
  };

  const handleFinalError: NonNullable<SmoothImageProps["onError"]> = (
    event
  ) => {
    setFinalFailed(true);
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
        <Wrapper
          aria-hidden="true"
          className={`absolute inset-0 transition-opacity duration-300 ease-out ${
            hasVisibleImage || showError
              ? "pointer-events-none opacity-0"
              : "opacity-100"
          }`}
          style={{
            background:
              "linear-gradient(90deg, hsl(var(--foreground) / 0.055) 30%, hsl(var(--foreground) / 0.14) 50%, hsl(var(--foreground) / 0.055) 70%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 1.5s ease-in-out infinite",
          }}
        />
      )}

      {!previewFailed && (
        <Image
          {...imageProps}
          {...(twoStage
            ? { sizes: previewSizes, quality: PREVIEW_QUALITY }
            : {})}
          alt={alt}
          className={`transition-[opacity,transform,scale] duration-300 ease-out ${
            previewLoaded ? "opacity-100" : "opacity-0"
          } ${className}`}
          placeholder={blurDataURL ? "blur" : undefined}
          blurDataURL={blurDataURL}
          onLoad={(event) => {
            setPreviewLoaded(true);
            if (!twoStage) onLoad?.(event);
          }}
          onError={handlePreviewError}
        />
      )}

      {twoStage && mountFinal && !finalFailed && (
        <Image
          {...imageProps}
          alt={alt}
          fetchPriority={imageProps.priority ? "high" : "auto"}
          className={`transition-[opacity,transform,scale] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            finalLoaded ? "opacity-100" : "opacity-0"
          } ${className}`}
          onLoad={(event) => {
            setFinalLoaded(true);
            onLoad?.(event);
          }}
          onError={handleFinalError}
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
            className="border-border bg-background/70 text-foreground hover:bg-background rounded-sm border px-2 py-1 text-[0.65rem] transition-colors"
          >
            Try again
          </button>
        </Wrapper>
      )}
    </Wrapper>
  );
}
