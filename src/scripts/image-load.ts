/**
 * Clears the shimmer behind each blog image once the image has decoded.
 *
 * components/smooth-image.tsx did this with per-image React state. It also
 * carried retry-and-fallback logic for third-party URLs that could 404
 * mid-read; the images are local hashed assets now, so that half is genuinely
 * obsolete. The shimmer is not — it was the only thing telling a reader that a
 * picture is on its way, and dropping it made the page feel like it popped in.
 *
 * Nothing here is load-bearing for visibility: the image is opaque from the
 * start and simply paints over the shimmer. This only stops the animation, so
 * the worst case if it never runs is a shimmer idling out of sight.
 *
 * One delegated listener for the whole page. `load` does not bubble, so it is
 * captured; images already complete when the script runs (cached, or decoded
 * before hydration) never fire it at all and are settled up front.
 */

import { once } from "./page-lifecycle";

/**
 * Keyed off the frame rather than an attribute on the image. An earlier version
 * tagged the <img> from the rehype plugin, but Astro rebuilds that node's
 * properties after the rehype phase and silently dropped the attribute — the
 * class survived only because className is a property hast knows about.
 * The wrapper is ours and cannot be rewritten out from under us.
 */
const FRAMED_IMG = ".image-frame img";

function settle(img: HTMLImageElement) {
  img.dataset.loaded = "true";
  const shimmer = img
    .closest(".image-frame")
    ?.querySelector<HTMLElement>(".image-shimmer");
  if (shimmer) shimmer.dataset.shimmerActive = "false";
}

export function initImageLoad(): void {
  // One delegated listener for the document's lifetime; the sweep below runs
  // per page, because each navigation brings new images.
  once("image-load", () =>
    document.addEventListener(
      "load",
      (event) => {
        const img = event.target as HTMLElement | null;
        if (img instanceof HTMLImageElement && img.closest(".image-frame")) {
          settle(img);
        }
      },
      true
    )
  );

  // Anything that finished before this ran will never fire `load`.
  for (const img of document.querySelectorAll<HTMLImageElement>(FRAMED_IMG)) {
    if (img.complete && img.naturalWidth > 0) settle(img);
  }
}
