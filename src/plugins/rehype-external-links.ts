import type { Root } from "hast";
import { visitElements } from "./hast";

/**
 * Replaces the `a` entry in both MDX component maps: an external link opens in
 * a new tab, an internal one does not.
 *
 * The two pages disagreed slightly on what "external" meant — the blog tested
 * `href.startsWith("http")` and /work/[slug] tested `http://` or `https://`.
 * The blog's test also matches `httpfoo`, so the stricter one wins here and
 * both routes now behave the same.
 */
export function rehypeExternalLinks() {
  return (tree: Root) => {
    visitElements(tree, (node) => {
      if (node.tagName !== "a") return;
      const href: unknown = node.properties?.href;
      if (typeof href !== "string") return;
      if (!/^https?:\/\//.test(href)) return;
      // Cast: @types/hast types both of these as Array<string>.
      const props = node.properties as Record<string, unknown>;
      props.target = "_blank";
      props.rel = "noopener noreferrer";
    });
  };
}
