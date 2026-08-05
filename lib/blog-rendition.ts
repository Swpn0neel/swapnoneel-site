// Deliberately imports nothing. This is the half of the rendition logic that
// has to run in the browser (next/image calls the loader again on hydration),
// and lib/blog-image-loader.ts pulls in the whole 61 KB image manifest — which
// would land in the client bundle for every blog reader if the two lived
// together. The widths arrive as a prop instead: a handful of integers per
// image, already in the RSC payload.
export function pickRendition(
  src: string,
  widths: number[],
  width: number
): string {
  // next/image builds its srcset from deviceSizes, so it can ask for a width
  // wider than the source ever was. Those images top out at their own width
  // rather than being upscaled into a larger file.
  const picked = widths.find((w) => w >= width) ?? widths[widths.length - 1];
  return src.replace(/\.webp$/, `-${picked}.avif`);
}
