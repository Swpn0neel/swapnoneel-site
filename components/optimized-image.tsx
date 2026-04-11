"use client";

import Image from "next/image";
import { useState } from "react";

interface OptimizedImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
  fit?: "cover" | "contain" | "fill";
  blurDataURL?: string;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = "",
  priority = false,
  fit = "cover",
  blurDataURL,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  return (
    <div className="bg-secondary/30 relative overflow-hidden">
      <div
        className={`bg-secondary/50 absolute inset-0 transition-opacity duration-300 ${
          isLoaded || hasError ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
        style={{ aspectRatio: `${width} / ${height}` }}
      >
        <div className="absolute inset-0 animate-pulse" />
      </div>

      {!hasError && (
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          className={`h-full w-full object-${fit} transition-opacity duration-300 ${
            isLoaded ? "opacity-100" : "opacity-0"
          } ${className}`}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          priority={priority}
          placeholder={blurDataURL ? "blur" : undefined}
          blurDataURL={blurDataURL}
        />
      )}

      {hasError && (
        <div
          className="bg-secondary/50 text-muted-foreground absolute inset-0 flex items-center justify-center p-4 text-center font-mono text-xs"
          style={{ aspectRatio: `${width} / ${height}` }}
        >
          {alt}
        </div>
      )}
    </div>
  );
}
