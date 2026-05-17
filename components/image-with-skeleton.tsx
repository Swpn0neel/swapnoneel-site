"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
            className="absolute inset-0 bg-secondary/35 flex flex-col items-center justify-center rounded-lg min-h-[220px] z-10 pointer-events-none"
          >
            {/* Elegant Library-driven Rotating Spinner */}
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              className="w-6 h-6 rounded-full border-2 border-primary/10 border-t-primary/70"
            />
            <span className="text-[10px] text-muted-foreground/60 select-none font-mono mt-2">
              Instant loading...
            </span>
          </motion.span>
        )}
      </AnimatePresence>

      {/* Error Fallback */}
      {hasError && (
        <span className="bg-secondary/40 text-muted-foreground flex items-center justify-center p-6 text-center rounded-lg border border-border min-h-[150px] font-mono text-xs select-none">
          Failed to load image: {alt || "Unnamed"}
        </span>
      )}

      {/* Actual Image Component */}
      {!hasError && src && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          onLoad={() => setLoaded(true)}
          onError={() => setHasError(true)}
          className={`transition-all duration-700 ease-out ${
            loaded ? "opacity-100 scale-100 filter-none" : "opacity-0 scale-[0.98] blur-[2px]"
          } ${className}`}
          loading={loading}
          {...props}
        />
      )}
    </span>
  );
}
