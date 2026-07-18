"use client";

import Image from "next/image";
import { ComponentProps, useEffect, useState } from "react";

interface SmoothImageProps extends Omit<
  ComponentProps<typeof Image>,
  "placeholder" | "blurDataURL"
> {
  blurDataURL?: string;
  showSkeleton?: boolean;
  // "span" when rendered in phrasing-content contexts (e.g. inside a
  // markdown paragraph) where a div would break HTML nesting rules
  as?: "div" | "span";
  // Two-stage loading: fetch a small cheap variant first, then, during
  // browser idle time after it lands, fetch the full-resolution variant at
  // low network priority and cross-fade it in over the same frame. Only
  // meaningful for optimizer-served images (a distinct low-res URL exists);
  // ignored when `unoptimized` since both stages would fetch the same file.
  progressive?: boolean;
}

// Stage-1 variant: small enough to land fast, large enough that the moment
// of upgrade isn't jarring if the user is mid-scroll.
const LOW_RES_SIZES = "384px";
const LOW_RES_QUALITY = 40;

function onIdle(callback: () => void): () => void {
  if (typeof window.requestIdleCallback === "function") {
    const id = window.requestIdleCallback(callback, { timeout: 3000 });
    return () => window.cancelIdleCallback(id);
  }
  const id = window.setTimeout(callback, 300);
  return () => window.clearTimeout(id);
}

export function SmoothImage({
  className = "",
  blurDataURL,
  alt = "",
  showSkeleton = false,
  as: Wrapper = "div",
  progressive = false,
  ...props
}: SmoothImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [mountHiRes, setMountHiRes] = useState(false);
  const [hiResLoaded, setHiResLoaded] = useState(false);
  const isFill = "fill" in props && props.fill;
  const twoStage = progressive && !props.unoptimized;

  // Defer the hi-res fetch until the low-res image has landed AND the
  // browser is idle, so it never competes with content still loading.
  useEffect(() => {
    if (!twoStage || !isLoaded || mountHiRes) return;
    return onIdle(() => setMountHiRes(true));
  }, [twoStage, isLoaded, mountHiRes]);

  return (
    <Wrapper
      className={`relative block overflow-hidden ${isFill ? "size-full" : ""}`}
    >
      {showSkeleton && (
        <Wrapper
          className={`absolute inset-0 transition-opacity duration-500 ${
            isLoaded || hasError
              ? "pointer-events-none opacity-0"
              : "opacity-100"
          }`}
          style={{
            // foreground-based tint: --secondary is ~96% lightness in light
            // mode, making a secondary-on-secondary shimmer invisible there
            background:
              "linear-gradient(90deg, hsl(var(--foreground) / 0.06) 30%, hsl(var(--foreground) / 0.18) 50%, hsl(var(--foreground) / 0.06) 70%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 1.2s ease-in-out infinite",
          }}
        />
      )}

      {!hasError && (
        <Image
          {...props}
          {...(twoStage
            ? { sizes: LOW_RES_SIZES, quality: LOW_RES_QUALITY }
            : {})}
          alt={alt}
          className={`transition duration-300 ${
            showSkeleton && !isLoaded ? "opacity-0" : "opacity-100"
          } ${className}`}
          placeholder={blurDataURL ? "blur" : undefined}
          blurDataURL={blurDataURL}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
        />
      )}

      {/* Stage 2: full-resolution upgrade, stacked over the low-res copy and
          faded in only once fully decoded — the swap itself is invisible. If
          it errors, the low-res copy simply stays. */}
      {!hasError && mountHiRes && (
        <Image
          {...props}
          alt={alt}
          fetchPriority="low"
          className={`transition-opacity duration-500 ${
            hiResLoaded ? "opacity-100" : "opacity-0"
          } ${className}`}
          onLoad={() => setHiResLoaded(true)}
        />
      )}

      {hasError && (
        <Wrapper className="bg-secondary/50 text-muted-foreground flex items-center justify-center p-4 text-center font-mono text-xs">
          {alt}
        </Wrapper>
      )}
    </Wrapper>
  );
}
