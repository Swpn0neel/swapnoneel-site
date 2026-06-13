"use client";

import Image from "next/image";
import { ComponentProps, useState } from "react";

interface SmoothImageProps extends Omit<
  ComponentProps<typeof Image>,
  "placeholder" | "blurDataURL"
> {
  blurDataURL?: string;
  showSkeleton?: boolean;
}

export function SmoothImage({
  className = "",
  blurDataURL,
  alt = "",
  showSkeleton = false,
  ...props
}: SmoothImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const isFill = "fill" in props && props.fill;

  return (
    <div className={`relative overflow-hidden ${isFill ? "size-full" : ""}`}>
      {showSkeleton && (
        <div
          className={`absolute inset-0 transition-opacity duration-500 ${
            isLoaded || hasError
              ? "pointer-events-none opacity-0"
              : "opacity-100"
          }`}
          style={{
            background:
              "linear-gradient(90deg, hsl(var(--secondary) / 0.3) 30%, hsl(var(--secondary) / 0.65) 50%, hsl(var(--secondary) / 0.3) 70%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 1.2s ease-in-out infinite",
          }}
        />
      )}

      {!hasError && (
        <Image
          {...props}
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

      {hasError && (
        <div className="bg-secondary/50 text-muted-foreground flex items-center justify-center p-4 text-center font-mono text-xs">
          {alt}
        </div>
      )}
    </div>
  );
}
