/**
 * Fades each blog image in when it decodes, and clears the shimmer behind it.
 *
 * components/smooth-image.tsx did this with per-image React state. It also
 * carried retry-and-fallback logic for third-party URLs that could 404
 * mid-read; the images are local hashed assets now, so that half is genuinely
 * obsolete. The fade and the shimmer are not — they were the only thing
 * telling a reader that a picture is on its way, and dropping them made the
 * page feel like it was popping in.
 *
 * One delegated listener for the whole page. `load` does not bubble, so it is
 * captured; images already complete when the script runs (cached, or decoded
 * before hydration) never fire it at all and are settled up front.
 */

function settle(img: HTMLImageElement) {
  img.dataset.loaded = "true";
  const shimmer =
    img.parentElement?.querySelector<HTMLElement>(".image-shimmer");
  if (shimmer) shimmer.dataset.shimmerActive = "false";
}

export function initImageLoad(): void {
  document.addEventListener(
    "load",
    (event) => {
      const img = event.target as HTMLElement | null;
      if (
        img instanceof HTMLImageElement &&
        img.hasAttribute("data-blog-img")
      ) {
        settle(img);
      }
    },
    true
  );

  // Anything that finished before this ran will never fire `load`.
  for (const img of document.querySelectorAll<HTMLImageElement>(
    "[data-blog-img]"
  )) {
    if (img.complete && img.naturalWidth > 0) settle(img);
  }
}
