import manifest from "@/lib/ui-images.json";

export interface UiImage {
  width: number;
  height: number;
  /** <source> entries in preference order, AVIF first. */
  sources: { type: string; srcSet: string }[];
  /** <img src> beneath the sources — the widest WebP rendition. */
  fallback: string;
}

// Pre-encoded by scripts/generate-ui-images.mjs from public/img and
// public/work. Undefined for anything the script has not seen, in which case
// the caller renders the original file directly rather than guessing at names
// that were never written.
export function uiImage(src: string): UiImage | undefined {
  return (manifest.sources as Record<string, UiImage>)[src];
}
