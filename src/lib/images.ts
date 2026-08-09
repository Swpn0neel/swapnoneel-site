import type { ImageMetadata } from "astro";

/**
 * Resolves the `/project/…`, `/work/…` and `/img/…` paths used in project and
 * work frontmatter to the actual assets, now that those files live in
 * src/assets rather than public/.
 *
 * They had to move: `public/` is copied verbatim, so leaving 5.3 MB of project
 * screenshots there would have shipped them unoptimised — next/image had been
 * transforming them on demand, and nothing in a static Astro build would.
 *
 * Doing the lookup here rather than rewriting the frontmatter keeps the paths
 * stable across three places that already agree on them: the markdown, the
 * keys in lib/palette-map.json, and scripts/generate-palette.mjs. A rewrite
 * would have had to land in all three at once for no gain.
 *
 * SVG is excluded on purpose — Astro turns SVG imports into components rather
 * than ImageMetadata, and the one SVG here (work/zonko.svg) is unreferenced.
 */
const modules = import.meta.glob<{ default: ImageMetadata }>(
  "/src/assets/{img,work,project}/*.{jpg,jpeg,png,webp,avif}",
  { eager: true }
);

const BY_PUBLIC_PATH = new Map<string, ImageMetadata>();
for (const [filePath, module] of Object.entries(modules)) {
  BY_PUBLIC_PATH.set(filePath.replace("/src/assets", ""), module.default);
}

/**
 * Undefined when the frontmatter names a file that is not on disk. Two hidden
 * projects do exactly that (`/project/inposter.jpg`, `/project/term-ai.jpg`),
 * and because they are filtered out of every listing it has never shown. The
 * callers fall back to a titled placeholder rather than failing the build.
 */
export function resolveAsset(
  path: string | undefined
): ImageMetadata | undefined {
  if (!path) return undefined;
  return BY_PUBLIC_PATH.get(path);
}

/** Every known asset path, for build-time assertions. */
export function knownAssetPaths(): string[] {
  return [...BY_PUBLIC_PATH.keys()].sort();
}
