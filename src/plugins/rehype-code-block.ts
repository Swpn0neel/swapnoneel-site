import type { Element, Root } from "hast";
import { classList, h, icon, textOf, visitElements } from "./hast";

/**
 * Replaces components/code-block.tsx and components/copy-button.tsx.
 *
 * The language chip and the copy button ride in the code box's top-right
 * corner, pinned there rather than laid out in flow so the code starts at the
 * very top of the box. `.prose pre` carries a right gutter wide enough that the
 * pair never covers a line, at rest or at full scroll — see the note there
 * before changing either. The bare ``` fences in the archive have no language,
 * so the chip is dropped there and the button keeps the corner.
 *
 * The chips fill with --background, not --secondary: --secondary *is* the box
 * they sit on, and --border matches it in dark, so a chip styled like the shell
 * would be invisible against it. They do restate the shell's 6px radius.
 *
 * React needed a component per block to hold "have I just been clicked"; the
 * button is stateless markup now and one delegated listener
 * (src/scripts/copy-code.ts) handles every block on the page.
 */

/* Only the four the archive actually uses, plus the aliases and neighbours a
   future post is most likely to reach for. Anything unlisted falls back to the
   fence's own word, capitalized — a label that reads a little plain is better
   than a missing one. */
const LANGUAGE_NAMES: Record<string, string> = {
  bash: "Bash",
  css: "CSS",
  diff: "Diff",
  go: "Go",
  html: "HTML",
  javascript: "JavaScript",
  js: "JavaScript",
  json: "JSON",
  jsx: "JSX",
  md: "Markdown",
  markdown: "Markdown",
  py: "Python",
  python: "Python",
  rust: "Rust",
  sh: "Shell",
  shell: "Shell",
  sql: "SQL",
  toml: "TOML",
  ts: "TypeScript",
  tsx: "TSX",
  typescript: "TypeScript",
  yaml: "YAML",
  yml: "YAML",
};

const COPY_PATHS = ["M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"];
const CHECK_PATHS = ["M20 6 9 17l-5-5"];
const X_PATHS = ["M18 6 6 18", "m6 6 12 12"];

const ICON_BASE = "absolute h-3 w-3 transition-all duration-300 ease-in-out";

/** The fence's language, read off the `language-*` class rehype-highlight
 *  leaves on the inner <code>. Null for the bare ``` fences in the archive. */
function languageOf(pre: Element): string | null {
  const code = pre.children.find(
    (child): child is Element =>
      child.type === "element" && child.tagName === "code"
  );
  if (!code) return null;
  const match = classList(code)
    .map((name) => /^language-([\w+-]+)$/.exec(name))
    .find(Boolean);
  if (!match) return null;
  const token = match[1].toLowerCase();
  return LANGUAGE_NAMES[token] ?? token.charAt(0).toUpperCase() + token.slice(1);
}

/**
 * Code text as a reader would want it pasted. The markdown sources are CRLF and
 * the closing fence always contributes a trailing newline nobody wants.
 */
function codeText(pre: Element): string {
  return textOf(pre).replace(/\r\n?/g, "\n").replace(/\n+$/, "");
}

export function rehypeCodeBlock() {
  return (tree: Root) => {
    visitElements(tree, (node, index, parent) => {
      if (node.tagName !== "pre") return;
      // Already wrapped on a previous pass.
      if (parent.type === "element" && classList(parent).includes("code-block")) return;

      const language = languageOf(node);
      const code = codeText(node);
      // A one-liner — an install command, usually — is short enough that the
      // chips' fixed top inset reads as misalignment rather than as a corner.
      // The modifier centres them on the single line instead; see global.css.
      const oneLine = !code.includes("\n");

      const controls: Element[] = [];
      if (language) {
        controls.push(
          h(
            "span",
            {
              className:
                "border-border bg-background/90 text-muted-foreground text-2xs flex h-6 items-center rounded-[6px] border px-2 font-medium",
            },
            [{ type: "text", value: language }]
          )
        );
      }

      controls.push(
        h(
          "button",
          {
            type: "button",
            "data-copy-code": "",
            "aria-label": "Copy code block",
            title: "Copy code block",
            className:
              "border-border bg-background/90 hover:bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-[6px] border transition-all duration-200 select-none",
          },
          [
            h(
              "div",
              {
                "aria-hidden": "true",
                className: "relative flex h-3 w-3 items-center justify-center",
              },
              [
                icon(COPY_PATHS, `${ICON_BASE} copy-icon-idle`, [
                  h("rect", { width: 14, height: 14, x: 8, y: 8, rx: 2, ry: 2 }),
                ]),
                icon(
                  CHECK_PATHS,
                  `${ICON_BASE} copy-icon-copied text-emerald-600 dark:text-emerald-400`
                ),
                icon(
                  X_PATHS,
                  `${ICON_BASE} copy-icon-error text-red-600 dark:text-red-400`
                ),
              ]
            ),
            // The icon swap is the only feedback a sighted reader gets; this is
            // the same confirmation for anyone listening.
            h("span", { "aria-live": "polite", className: "sr-only" }, []),
          ]
        )
      );

      const wrapper = h(
        "div",
        {
          className: oneLine ? "code-block code-block--one-line" : "code-block",
          // The text the button copies. Kept on the wrapper rather than
          // re-derived from the DOM at click time, because the highlighted
          // markup has the tokens split across dozens of spans.
          "data-code": code,
        },
        [h("div", { className: "code-block__controls" }, controls), node]
      );

      (parent.children as unknown[])[index] = wrapper;
    });
  };
}
