"use client";

import Image from "next/image";
import { useState } from "react";

interface ExperienceLogoProps {
  alt: string;
  src?: string;
  size?: number;
}

export function ExperienceLogo({ alt, src, size = 60 }: ExperienceLogoProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  if (!src) {
    return (
      <div
        className="bg-secondary shrink-0 rounded-md"
        style={{ width: size, height: size }}
      />
    );
  }

  const adaptsToTheme = src === "/work/zonko.webp";

  return (
    <span
      className="relative block shrink-0 overflow-hidden rounded-md"
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
        width={size}
        height={size}
        // No `sizes` — these are fixed-size, so Next emits a 1x/2x srcset
        // instead of a 17-entry responsive one spanning up to 1536w.
        // Eager so the logos are present on first paint rather than popping in
        // as the experience section scrolls up. fetchPriority stays low so they
        // queue behind the font and app chunks and don't push LCP out; q=60 is
        // indistinguishable at 40px and keeps the added bytes near-negligible.
        loading="eager"
        fetchPriority="low"
        quality={60}
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
