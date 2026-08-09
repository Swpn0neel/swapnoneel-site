import type { Element, Root } from "hast";
import { classList, h, visitElements } from "./hast";

/**
 * Replaces components/blog-image.tsx and components/smooth-image.tsx.
 *
 * Astro has already turned each markdown `![alt](path)` into an optimised
 * <img> with a srcset by the time this runs — the images live in
 * src/assets/blog-img now, so the build owns them. What is left is the framing
 * the React component added: the bordered box, the aspect ratio, the caption,
 * and the `sizes` string.
 *
 * Gone with it: the retry-and-fallback machinery in SmoothImage, which existed
 * because the sources were third-party URLs that could 404 mid-read, and the
 * fade-in, which existed because the browser could not know an image's size in
 * advance. Neither is true of a hashed local asset with intrinsic dimensions
 * baked into the tag.
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
      if (parent.type === "element" && classList(parent).includes("blog-figure")) {
        return;
      }

      const props = node.properties as Record<string, unknown>;
      const alt = typeof props.alt === "string" ? props.alt : "";
      const width = Number(props.width) || 0;
      const height = Number(props.height) || 0;
      const ratio = width && height ? `${width} / ${height}` : "16 / 9";

      props.sizes = IMAGE_SIZES;
      props.decoding = "async";
      props.className = ["absolute", "inset-0", "size-full", "object-cover"];

      seen += 1;
      if (seen <= EAGER_IMAGE_COUNT) {
        // Next emitted a <link rel=preload> for eager images as well as
        // priority ones, so a post with two lead images preloaded three at
        // equal priority and let the below-the-fold pair compete with the
        // cover. Nothing preloads here, but the split is kept: lead images skip
        // lazy loading and still yield to the cover.
        props.loading = "eager";
        props.fetchpriority = "low";
      } else {
        props.loading = "lazy";
      }

      const frame = h(
        "span",
        {
          className:
            "border-border bg-secondary/30 relative block w-full overflow-hidden rounded-md border",
          style: `aspect-ratio:${ratio}`,
        },
        [node]
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
