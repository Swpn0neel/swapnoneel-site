import manifest from "@/lib/project-images.json";

export interface ProjectRenditions {
  /** Preload href — the widest AVIF. */
  widest: string;
  /** <source> entries in preference order, AVIF first. */
  sources: { type: string; srcSet: string }[];
}

// Undefined for any cover outside public/project — those keep the normal
// next/image path instead of getting a <source> pointing at files that were
// never encoded. A <picture> gives no fallback once a <source> matches, so a
// guessed filename would be a broken image rather than a slower one.
export function projectRenditions(src: string): ProjectRenditions | undefined {
  return (manifest.sources as Record<string, ProjectRenditions>)[src];
}
