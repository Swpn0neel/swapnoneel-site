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
        // as the experience section scrolls up. No explicit fetchPriority: it
        // used to be "low", which overrode the browser's own judgement in both
        // directions — below the fold Chrome already keeps these Low by itself,
        // and on a tall screen where they are visible it was holding back the
        // only thing left to paint.
        // quality={90} because Next encodes AVIF at quality-20 (see
        // next.config), so the default shipped these at q55. Wordmarks and thin
        // logo strokes are the worst case for that, and it is most of what made
        // them read as cheap; every source here is 1-9 KB, so the crisper
        // rendition costs a few hundred bytes. Set here rather than per-caller
        // so the (url, width, quality) triple stays shared across pages.
        loading="eager"
        quality={90}
        decoding="async"
        className={`relative rounded-md object-cover ${
          adaptsToTheme ? "dark:brightness-200 dark:invert" : ""
        }`}
        style={{ width: size, height: size }}
      />
    </span>
  );
}
