import fs from "fs";
import path from "path";
import { cache } from "react";
import { narrationTokens } from "./mdx";

/**
 * v2 manifest. `starts[i]` is the start time in ms of source token `i` — the
 * same `i` that `rehypeNarrate` stamps as `data-nwi`, so the player needs no
 * alignment step.
 *
 * v1 stored the raw TTS word list and its boundaries instead, which the client
 * had to fuzzy-match against a TreeWalker pass on every page load.
 * `scripts/align-narrations.mjs` converts v1 to v2 without re-synthesising.
 */
export type NarrationManifest = {
  v: number;
  audio: string;
  durationMs: number;
  /** Token count this manifest was built for; guards against drifted markdown. */
  count?: number;
  starts: number[];
  /** v1 only. */
  words?: string[];
};

function manifestPath(slug: string, year: number): string {
  return path.join(
    process.cwd(),
    "public",
    "narration",
    String(year),
    `${slug}.json`
  );
}

function readManifest(slug: string, year: number): NarrationManifest | null {
  try {
    const raw = fs.readFileSync(manifestPath(slug, year), "utf8");
    const data = JSON.parse(raw) as NarrationManifest;
    if (!data || typeof data.durationMs !== "number" || !data.audio) return null;
    return data;
  } catch {
    return null;
  }
}

export type NarrationInfo = {
  /** Wrap words in the rendered HTML — only when timings actually line up. */
  enabled: boolean;
  /** Token count derived from the markdown. */
  count: number;
};

/**
 * Decides whether a post's article should carry narration word spans.
 *
 * A post whose markdown changed after its audio was generated would produce a
 * token list the manifest no longer describes, and highlighting would drift
 * further out with every paragraph. Rather than half-work, the spans are left
 * out entirely and the player hides itself.
 */
export const getNarrationInfo = cache(
  (slug: string, year: number, markdown: string): NarrationInfo => {
    const count = narrationTokens(markdown).length;
    const manifest = readManifest(slug, year);
    if (!manifest || count === 0) return { enabled: false, count };

    // Only v2 is token-indexed. A v1 manifest left over from before the
    // conversion describes TTS tokens, which these indices are not — run
    // scripts/align-narrations.mjs to upgrade it.
    if (manifest.v < 2) return { enabled: false, count };
    return { enabled: manifest.starts?.length === count, count };
  }
);
