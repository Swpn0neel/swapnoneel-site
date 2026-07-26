"use client";

import Image from "next/image";
import { useState } from "react";

interface ExperienceLogoProps {
  alt: string;
  src?: string;
  size?: number;
  /**
   * Low-priority is right when the logo sits below other above-the-fold
   * content (home, behind the hero) and can afford to lose the fetch queue to
   * fonts/JS. Set this false where the logo IS the top-of-page content (e.g.
   * /work's experience section) so it doesn't visibly pop in after paint.
   */
  lowPriority?: boolean;
  /** Layout classes for the outer box — e.g. floating it out of the text flow. */
  className?: string;
}

// The intrinsic size we always request, regardless of how large the logo is
// actually drawn. /work renders these at 60 and the home page at 40; fetching
// one size for both means the home page primes the cache for /work (and vice
// versa) instead of each page pulling its own rendition. 60 is the larger of
// the two, so the smaller usage downscales rather than upscaling.
const FETCH_SIZE = 60;

export function ExperienceLogo({
  alt,
  src,
  size = 60,
  lowPriority = true,
  className = "",
}: ExperienceLogoProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  if (!src) {
    return (
      <div
        className={`bg-secondary shrink-0 rounded-md ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  const adaptsToTheme = src === "/work/zonko.webp";

  return (
    <span
      className={`relative block shrink-0 overflow-hidden rounded-md ${className}`}
      style={{ width: size, height: size }}
    >
      <span
        aria-hidden="true"
        className={`bg-secondary/55 pointer-events-none absolute inset-0 rounded-md transition-opacity duration-200 ${
          isLoaded ? "opacity-0" : "opacity-100"
        }`}
      />
      <Image
        src={src}
        alt={alt}
        width={FETCH_SIZE}
        height={FETCH_SIZE}
        // No `sizes` — these are fixed-size, so Next emits a 1x/2x srcset
        // instead of a 17-entry responsive one spanning up to 1536w.
        // Eager so the logos are present on first paint rather than popping in
        // as the experience section scrolls up. fetchPriority is low by default
        // so they queue behind the font and app chunks and don't push LCP out;
        // callers whose logo IS the top-of-page content (no hero ahead of it to
        // buy loading time) opt out via `lowPriority={false}` so it doesn't
        // visibly pop in after paint. Quality is left at the default so every
        // (url, width, quality) triple stays shared across pages.
        loading="eager"
        fetchPriority={lowPriority ? "low" : "auto"}
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        className={`relative rounded-md object-cover ${
          adaptsToTheme ? "dark:brightness-200 dark:invert" : ""
        }`}
        style={{ width: size, height: size }}
      />
    </span>
  );
}
