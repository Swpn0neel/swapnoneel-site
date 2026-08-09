import type { Element, Root } from "hast";
import { classList, h, visitElements } from "./hast";

/**
 * Frames each markdown image: bordered box, shimmer while it loads, caption
 * from the alt text.
 *
 * A note on the frame's height, because the obvious approach is wrong here.
 * This plugin used to read `width`/`height` off the <img> and set an explicit
 * `aspect-ratio` on the wrapper. Astro injects those attributes *after* the
 * rehype phase, so they were always absent and every image silently fell back
 * to 16/9 — 158 of 203 images were boxed at the wrong ratio and cropped by
 * object-cover. The frame now takes its height from the image instead: the
 * <img> sits in normal flow at `width:100%; height:auto`, and the browser
 * reserves the right box from the width/height attributes it ends up with. No
 * ratio to guess, no crop, and still no layout shift.
 */

/**
 * The rendered column is ~770px: max-w-2xl is 42rem and the root font-size is
 * 120%, so the container is ~806px and the content ~770px wide.
 *
 * The two density conditions hold high-DPR phones below their nominal pixel
 * count — a 390px-wide phone asking for the literal ~1170px it wants at 3x
 * costs several times the bytes for detail the panel barely resolves. But
 * 49/65vw undershot hard enough to be visibly soft: they pinned a 3x phone to
 * the 960 candidate for a ~358px slot, i.e. an effective 2.7x. 70/85vw reaches
 * the 1280 candidate instead.
 */
const IMAGE_SIZES =
  "(max-width: 640px) and (min-resolution: 3.5dppx) 70vw, " +
  "(max-width: 640px) and (min-resolution: 2.5dppx) 85vw, " +
  "(max-width: 810px) 100vw, 770px";

/** Lead images skip lazy loading so their request starts with the page. */
const EAGER_IMAGE_COUNT = 2;

export function rehypeBlogImage() {
  return (tree: Root) => {
    let seen = 0;

    visitElements(tree, (node, index, parent) => {
      if (node.tagName !== "img") return;
      if (
        parent.type === "element" &&
        classList(parent).includes("image-frame")
      ) {
        return;
      }

      const props = node.properties as Record<string, unknown>;
      const alt = typeof props.alt === "string" ? props.alt : "";

      props.sizes = IMAGE_SIZES;
      props.decoding = "async";
      props.className = ["blog-img"];
      props["data-blog-img"] = "";

      seen += 1;
      if (seen <= EAGER_IMAGE_COUNT) {
        // Lead images skip lazy loading so the request starts with the page,
        // but still yield to the cover, which is the LCP candidate.
        props.loading = "eager";
        props.fetchpriority = "low";
      } else {
        props.loading = "lazy";
      }

      const frame = h(
        "span",
        {
          className:
            "image-frame border-border bg-secondary/30 relative block w-full overflow-hidden rounded-md border",
        },
        [
          h("span", {
            className: "image-shimmer absolute inset-0",
            "data-shimmer-active": "true",
            "aria-hidden": "true",
          }),
          node,
        ]
      );

      const children: Element[] = [frame];
      if (alt) {
        // Scales with the reader's A-/A/A+ choice (--prose-scale) so captions
        // stay proportional to the article body.
        children.push(
          h(
            "span",
            {
              className:
                "text-muted-foreground mt-2 block text-center font-mono text-[calc(0.75rem*var(--prose-scale,1))]",
            },
            [{ type: "text", value: alt }]
          )
        );
      }

      // data-no-narrate: the blog narrator skips this subtree (image + caption).
      const figure = h(
        "span",
        { className: "blog-figure my-6 block", "data-no-narrate": "" },
        children
      );

      (parent.children as unknown[])[index] = figure;
    });
  };
}
