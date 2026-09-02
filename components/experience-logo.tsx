import { StaticImage } from "@/components/static-image";
import { uiImage } from "@/lib/ui-image-loader";

interface ExperienceLogoProps {
  alt: string;
  src?: string;
  size?: number;
  /** Layout classes for the outer box — e.g. floating it out of the text flow. */
  className?: string;
}

// The slot width we always declare, regardless of how large the logo is
// actually drawn. /work renders these at 60 and the home page at 40; asking
// for one size on both means the home page primes the cache for /work (and
// vice versa) instead of each page pulling its own rendition. 60 is the larger
// of the two, so the smaller usage downscales rather than upscaling.
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
  // Encoded at build by scripts/generate-ui-images.mjs at exactly the 1x and
  // 2x widths this slot renders, and served immutable from /ui-img. The
  // optimizer used to answer these with max-age=0, so every repeat visit
  // revalidated all five before the section settled.
  const image = uiImage(src);

  return (
    <StaticImage
      as="span"
      src={image?.fallback ?? src}
      alt={alt}
      width={FETCH_SIZE}
      height={FETCH_SIZE}
      sources={image?.sources}
      sizes={`${FETCH_SIZE}px`}
      // Eager so the logos are present on first paint rather than popping in
      // as the experience section scrolls up. No fetchPriority: below the fold
      // Chrome already keeps these low by itself, and on a tall screen where
      // they are visible a "low" override held back the only thing left to paint.
      loading="eager"
      showSkeleton={false}
      frameClassName={`shrink-0 rounded-md ${className}`}
      frameStyle={{ width: size, height: size }}
      className={`h-full w-full rounded-md object-cover ${
        adaptsToTheme ? "dark:brightness-200 dark:invert" : ""
      }`}
    />
  );
}
