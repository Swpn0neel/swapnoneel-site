"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

interface ImageWithSkeletonProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  wrapperClassName?: string;
}

export function ImageWithSkeleton({
  src,
  alt,
  className = "",
  wrapperClassName = "",
  loading = "eager", // Preload instantly when the blog detail page is opened!
  ...props
}: ImageWithSkeletonProps) {
  const [loaded, setLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Check if the image is already cached on mount to load instantly
  useEffect(() => {
    if (imgRef.current && imgRef.current.complete) {
      setLoaded(true);
    }
  }, [src]);

  return (
    <span className={`relative block overflow-hidden ${wrapperClassName}`}>
      {/* Framer Motion AnimatePresence for smooth skeleton fade-out */}
      <AnimatePresence mode="wait">
        {!loaded && !hasError && (
          <motion.span
            key="skeleton"
            initial={{ opacity: 0.6 }}
            animate={{ opacity: [0.6, 1, 0.6] }}
            exit={{ opacity: 0, transition: { duration: 0.4 } }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="bg-secondary/35 pointer-events-none absolute inset-0 z-10 flex min-h-[220px] flex-col items-center justify-center rounded-lg"
          >
            {/* Elegant Library-driven Rotating Spinner */}
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              className="border-primary/10 border-t-primary/70 h-6 w-6 rounded-full border-2"
            />
            <span className="text-muted-foreground/60 mt-2 font-mono text-[10px] select-none">
              Instant loading...
            </span>
          </motion.span>
        )}
      </AnimatePresence>

      {/* Error Fallback */}
      {hasError && (
        <span className="bg-secondary/40 text-muted-foreground border-border flex min-h-[150px] items-center justify-center rounded-lg border p-6 text-center font-mono text-xs select-none">
          Failed to load image: {alt || "Unnamed"}
        </span>
      )}

      {/* Actual Image Component */}
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
