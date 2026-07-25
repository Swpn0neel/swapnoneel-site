"use client";

import Image from "next/image";
import { useState } from "react";

interface ExperienceLogoProps {
  alt: string;
  src?: string;
}

export function ExperienceLogo({ alt, src }: ExperienceLogoProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  if (!src) {
    return <div className="bg-secondary size-15 shrink-0 rounded-md" />;
  }

  const adaptsToTheme = src === "/work/zonko.webp";

  return (
    <span className="relative block size-15 shrink-0 overflow-hidden rounded-md">
      <span
        aria-hidden="true"
        className={`bg-secondary/55 pointer-events-none absolute inset-0 rounded-md transition-opacity duration-200 ${isLoaded ? "opacity-0" : "opacity-100"
          }`}
      />
      <Image
        src={src}
        alt={alt}
        width={60}
        height={60}
        sizes="60px"
        loading="lazy"
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        className={`relative size-15 rounded-md object-cover ${adaptsToTheme ? "dark:brightness-200 dark:invert" : ""
          }`}
      />
    </span>
  );
}
