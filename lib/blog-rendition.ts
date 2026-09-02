// Deliberately imports nothing. This used to be the browser half of the
// rendition logic, back when next/image re-ran the loader on hydration; images
// are server-rendered <picture> elements now, so it only runs at build. It
// stays separate from lib/blog-image-loader.ts (which imports the 76 KB
// manifest) so that a client component can still call it if one ever needs to.
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
