import Image from "next/image";

interface ExperienceLogoProps {
  alt: string;
  src?: string;
  size?: number;
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
  className = "",
}: ExperienceLogoProps) {
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
      <Image
        src={src}
        alt={alt}
        width={FETCH_SIZE}
        height={FETCH_SIZE}
        // No `sizes` — these are fixed-size, so Next emits a 1x/2x srcset
        // instead of a 17-entry responsive one spanning up to 1536w.
        // Eager so the logos are present on first paint rather than popping in
        // as the experience section scrolls up. fetchPriority stays low
        // so they queue behind the font and app chunks and don't push LCP out;
        // low priority keeps the logos behind fonts and critical hero assets
        // without visually delaying them. Quality is left at the default so every
        // (url, width, quality) triple stays shared across pages.
        loading="eager"
        fetchPriority="low"
        decoding="async"
        className={`relative rounded-md object-cover ${
          adaptsToTheme ? "dark:brightness-200 dark:invert" : ""
        }`}
        style={{ width: size, height: size }}
      />
    </span>
  );
}
