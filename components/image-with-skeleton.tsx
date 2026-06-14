"use client";

import { useEffect, useRef, useState } from "react";

interface ImageWithSkeletonProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  wrapperClassName?: string;
}

export function ImageWithSkeleton({
  src,
  alt,
  className = "",
  wrapperClassName = "",
  loading = "eager",
  ...props
}: ImageWithSkeletonProps) {
  const [loaded, setLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (imgRef.current && imgRef.current.complete) {
      setLoaded(true);
    }
  }, [src]);

  return (
    <span className={`relative block overflow-hidden ${wrapperClassName}`}>
      {/* Skeleton overlay — fades out when image loads */}
      {!hasError && (
        <span
          className={`pointer-events-none absolute inset-0 z-10 transition-opacity duration-400 ${
            loaded ? "opacity-0" : "opacity-100"
          }`}
        >
          <span className="bg-secondary/35 flex min-h-[220px] flex-col items-center justify-center rounded-lg">
            <span className="border-primary/10 border-t-primary/70 h-6 w-6 animate-spin rounded-full border-2" />
            <span className="text-muted-foreground/60 mt-2 animate-pulse font-mono text-[10px] select-none">
              Instant loading...
            </span>
          </span>
        </span>
      )}

      {/* Error Fallback */}
      {hasError && (
        <span className="bg-secondary/40 text-muted-foreground border-border flex min-h-[150px] items-center justify-center rounded-lg border p-6 text-center font-mono text-xs select-none">
          Failed to load image: {alt || "Unnamed"}
        </span>
      )}

      {/* Actual Image */}
      {!hasError && src && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          onLoad={() => setLoaded(true)}
          onError={() => setHasError(true)}
          className={`transition-all duration-700 ease-out ${
            loaded
              ? "scale-100 opacity-100 filter-none"
              : "scale-[0.98] opacity-0 blur-[2px]"
          } ${className}`}
          loading={loading}
          {...props}
        />
      )}
    </span>
  );
}
