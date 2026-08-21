import type { Element, Root, RootContent } from "hast";

// Subtrees that are never narrated. The same set the markdown extractor skips
// (`code`/`table`/`image`/`html`), expressed as rendered tags so the build walk
// and the browser walk agree on what counts as a word.
const NARRATION_SKIP_TAGS = new Set([
  "pre",
  "code",
  "table",
  "img",
  "figure",
  "figcaption",
  "script",
  "style",
  "svg",
]);

// Elements a run of words is anchored to. Matches BLOCK_TAGS in lib/mdx.ts.
const BLOCK_TAGS = new Set([
  "p",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "li",
  "blockquote",
  "td",
  "dt",
  "dd",
]);

function isSkipped(node: Element): boolean {
  if (NARRATION_SKIP_TAGS.has(node.tagName)) return true;
  const props = node.properties ?? {};
  return "dataNoNarrate" in props || "data-no-narrate" in props;
}

function countWords(value: string): number {
  let n = 0;
  for (const token of value.split(/\s+/)) if (token) n++;
  return n;
}

/**
 * Marks each narrated block with the range of narration tokens it contains:
 * `data-nwb` is the index of its first word, `data-nwc` how many it has.
 *
 * Those indices address `starts` in `public/narration/<year>/<slug>.json`, so
 * the player can wrap and time words without a TreeWalker over the article, a
 * Range per word, or the fuzzy TTS-to-DOM alignment that used to run on every
 * page load — all of that is decided at build now.
 *
 * Anchoring per block rather than per word is deliberate. Emitting a span for
 * every word server-side measured at +30 KB gzip on the longest post (nearly
 * double its HTML) and roughly 3,000 extra DOM nodes, paid by every reader
 * including the large majority who never press play. Two attributes per block
 * costs well under a kilobyte, and the spans get created only if playback
 * actually starts.
 *
 * The count is also a correctness guard: the browser re-derives each block's
 * words from the rendered DOM, which MDX component overrides can perturb, and a
 * block whose count disagrees is timed on its own without throwing the rest of
 * the article out of step.
 */
export function rehypeNarrate(options: { enabled?: boolean } = {}) {
  const { enabled = true } = options;

  return (tree: Root) => {
    if (!enabled) return;
    let index = 0;

    // Counts every word in a subtree, honouring the skip set.
    const count = (node: Root | Element): number => {
      let total = 0;
      for (const child of node.children as RootContent[]) {
        if (child.type === "text") total += countWords(child.value);
        else if (child.type === "element" && !isSkipped(child)) {
          total += count(child);
        }
      }
      return total;
    };

    const walk = (node: Root | Element, inBlock: boolean) => {
      for (const child of node.children as RootContent[]) {
        if (child.type !== "element" || isSkipped(child)) continue;

        if (!inBlock && BLOCK_TAGS.has(child.tagName)) {
          const words = count(child);
          if (words > 0) {
            child.properties = {
              ...(child.properties ?? {}),
              "data-nwb": String(index),
              "data-nwc": String(words),
            };
            index += words;
          }
          // Nested blocks (a <p> inside a loose <li>) stay inside this anchor.
          walk(child, true);
          continue;
        }

        walk(child, inBlock);
      }
    };

    walk(tree, false);
    return tree;
  };
}
