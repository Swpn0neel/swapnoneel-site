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
        sizes={`${size}px`}
        loading="eager"
        fetchPriority="low"
        decoding="async"
        unoptimized
        onLoad={() => setIsLoaded(true)}
        className={`relative rounded-md object-cover ${
          adaptsToTheme ? "dark:brightness-200 dark:invert" : ""
        }`}
        style={{ width: size, height: size }}
      />
    </span>
  );
}
