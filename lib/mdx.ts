import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";
import type { Root } from "mdast";

const EAGER_IMAGE_COUNT = 1;

export function cleanMarkdown(markdown: string): string {
  return (markdown || "")
    .replace(
      /<mark>(.*?)<\/mark>\s*\((https?:\/\/.*?)\)/gi,
      "[<mark>$1</mark>]($2)"
    )
    .replace(/(!\[.*?\]\(([^)]*?))\s+align=".*?"\)/g, "$1)")
    .replace(/%%?\[.*?\]/g, "");
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function parseMarkdown(markdown: string): Root {
  return unified()
    .use(remarkParse)
    .use(remarkGfm)
    .parse(cleanMarkdown(markdown)) as Root;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function headingPlainText(node: any): string {
  if (!node) return "";
  switch (node.type) {
    case "text":
      return node.value ?? "";
    case "inlineCode":
      return node.value ?? "";
    case "html":
      return "";
    case "image":
    case "imageReference":
      return node.alt ?? "";
    default: {
      const children = (node as { children?: unknown[] }).children;
      if (Array.isArray(children)) {
        return children.map(headingPlainText).join("");
      }
      return "";
    }
  }
}

export function extractHeadings(
  markdown: string
): { text: string; slug: string; level: number }[] {
  const tree = parseMarkdown(markdown);
  const headings: { text: string; slug: string; level: number }[] = [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function visit(node: any) {
    if (node.type === "heading" && node.depth >= 1 && node.depth <= 4) {
      const raw = headingPlainText(node).replace(/\s+/g, " ").trim();
      if (raw) {
        headings.push({ text: raw, slug: generateSlug(raw), level: node.depth });
      }
    }
    if (node.children && Array.isArray(node.children)) {
      for (const child of node.children) visit(child);
    }
  }

  visit(tree);
  return headings;
}

export function extractLeadImageSources(
  markdown: string,
  limit: number = EAGER_IMAGE_COUNT
): Set<string> {
  const tree = parseMarkdown(markdown);
  const sources = new Set<string>();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function visit(node: any) {
    if (sources.size >= limit) return;
    if (node.type === "image" && typeof node.url === "string") {
      sources.add(node.url);
      if (sources.size >= limit) return;
    }
    if (node.children && Array.isArray(node.children)) {
      for (const child of node.children) {
        if (sources.size >= limit) break;
        visit(child);
      }
    }
  }

  visit(tree);
  return sources;
}

// Narration extraction — the text that is actually spoken.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function inlineText(node: any): string {
  switch (node.type) {
    case "text":
      return node.value ?? "";
    case "inlineCode":
    case "image":
    case "imageReference":
    case "html":
      return "";
    case "break":
      return " ";
    default:
      return ((node.children as unknown[]) || [])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((c: any) => inlineText(c))
        .join("");
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function collectBlocks(node: any, out: string[]) {
  switch (node.type) {
    case "heading":
    case "paragraph": {
      const t = inlineText(node).replace(/\s+/g, " ").trim();
      if (t) out.push(t);
      break;
    }
    case "code":
    case "table":
    case "html":
    case "thematicBreak":
      break;
    default:
      for (const child of (node.children as unknown[]) || []) {
        collectBlocks(child, out);
      }
      break;
  }
}

export function extractBlocks(markdown: string): string[] {
  const tree = parseMarkdown(markdown);
  const blocks: string[] = [];
  collectBlocks(tree, blocks);
  return blocks;
}

// ─────────────────────────────────────────────────────────────────────────────
// Narration: build-time word identity
//
// The narrator used to re-derive words in the browser (TreeWalker over the
// rendered article) and then fuzzy-match that list against the TTS word
// boundaries on every page load. Both halves are decided here instead, once,
// at build:
//
//   narrationTokens()  the exact word list, from the same markdown the TTS read
//   alignNarration()   TTS boundaries -> one start time per token
//   rehypeNarrate()    stamps each token's index onto the rendered HTML
//
// so the client only has to read an index off a span. The token list and the
// wrapped spans come from the same markdown via the same skip rules, which is
// what makes the index a 1:1 key rather than something to re-align.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Word list the narration timings are indexed by, in document order.
 *
 * Tokenised per text node rather than per block, because that is what the
 * rendered DOM can actually address: in `validation in __init__, both`, the
 * emphasis makes `init` and `,` separate text nodes, so the browser sees two
 * words where a block-level split sees one (`init,`). Matching the DOM's
 * convention here is what lets `data-nwi` be an index instead of a guess —
 * `rehypeNarrate` counts the same way, and scripts/check-narration-parity.mjs
 * asserts the two agree for every post.
 */
export function narrationTokens(markdown: string): string[] {
  const tokens: string[] = [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const visit = (node: any) => {
    switch (node.type) {
      case "text": {
        for (const word of String(node.value ?? "").split(/\s+/)) {
          if (word) tokens.push(word);
        }
        return;
      }
      // Skipped for the same reason the extractor skips them: none of this is
      // spoken, so none of it can carry a timing.
      case "inlineCode":
      case "image":
      case "imageReference":
      case "html":
      case "code":
      case "table":
      case "thematicBreak":
        return;
      default: {
        for (const child of (node.children as unknown[]) || []) visit(child);
      }
    }
  };

  visit(parseMarkdown(markdown));
  return tokens;
}

const normWord = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");

/**
 * One start time (ms) per source token.
 *
 * The two lists are close but not equal: the TTS service splits hyphenated
 * words, merges some tokens, and speaks expansions ("2026" -> "twenty
 * twenty-six") that have no source token. This is the same tolerant two-pointer
 * walk the client used to run on every page load, with unmatched tokens
 * interpolated between their nearest anchors and the result forced monotonic so
 * the highlight can never move backwards.
 */
export function alignNarration(
  tokens: string[],
  ttsWords: string[],
  ttsStarts: number[],
  durationMs: number
): number[] {
  const norm = tokens.map(normWord);
  const n = norm.length;
  const starts: number[] = new Array(n).fill(-1);
  let k = 0;
  let acc = "";

  for (let j = 0; j < ttsWords.length && k < n; j++) {
    const tn = normWord(ttsWords[j]);
    const t = ttsStarts[j];
    if (!tn) continue;

    // Punctuation-only source tokens ("—", "→") inherit the upcoming time.
    while (k < n && !norm[k]) {
      if (starts[k] < 0) starts[k] = t;
      k++;
    }
    if (k >= n) break;

    if (acc) {
      const next = acc + tn;
      if (norm[k].startsWith(next)) {
        acc = next.length >= norm[k].length ? "" : next;
        if (!acc) k++;
        continue;
      }
      acc = "";
      k++;
      while (k < n && !norm[k]) {
        starts[k] = t;
        k++;
      }
      if (k >= n) break;
    }

    if (norm[k].startsWith(tn)) {
      starts[k] = t;
      acc = tn.length >= norm[k].length ? "" : tn;
      if (!acc) k++;
    } else if (tn.startsWith(norm[k])) {
      // One TTS token spans several source tokens.
      let rem = tn;
      while (k < n && rem && norm[k] && rem.startsWith(norm[k])) {
        starts[k] = t;
        rem = rem.slice(norm[k].length);
        k++;
      }
    } else {
      // Source-side extras (emoji, un-narrated inline islands): look a few
      // ahead, otherwise treat the TTS token as an extra and drop it.
      let found = -1;
      for (let d = 1; d <= 4 && k + d < n; d++) {
        if (norm[k + d] && norm[k + d].startsWith(tn)) {
          found = k + d;
          break;
        }
      }
      if (found >= 0) {
        while (k < found) {
          if (starts[k] < 0) starts[k] = t;
          k++;
        }
        starts[k] = t;
        acc = tn.length >= norm[k].length ? "" : tn;
        if (!acc) k++;
      }
    }
  }

  let prevIdx = -1;
  let prevVal = 0;
  for (let i = 0; i <= n; i++) {
    const val = i === n ? durationMs : starts[i];
    if (i < n && val < 0) continue;
    for (let j = prevIdx + 1; j < i; j++) {
      starts[j] = prevVal + ((val - prevVal) * (j - prevIdx)) / (i - prevIdx);
    }
    if (i < n) {
      starts[i] = Math.max(val, prevVal);
      prevVal = starts[i];
      prevIdx = i;
    }
  }
  return starts.map((v) => Math.round(v));
}
