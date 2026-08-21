import type { ReactNode } from "react";

/** Flatten a rendered MDX subtree back to the text it displays. */
export function getRawText(node: ReactNode): string {
  if (!node) return "";
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node))
    return (node as ReactNode[]).map(getRawText).join("");
  if (
    node &&
    typeof node === "object" &&
    "props" in node &&
    node.props &&
    typeof node.props === "object" &&
    "children" in node.props
  ) {
    return getRawText((node.props as { children?: ReactNode }).children);
  }
  return "";
}

/**
 * Code text as a reader would want it pasted. The markdown sources are CRLF,
 * and the browser's HTML parser normalizes that away — but this text comes off
 * the React tree, which never goes through the parser, so the carriage returns
 * survive into the clipboard and land in a shell as `^M`. The closing fence
 * also always contributes a trailing newline nobody wants to paste.
 */
export function normalizeCodeText(node: ReactNode): string {
  return getRawText(node).replace(/\r\n?/g, "\n").replace(/\n+$/, "");
}

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

/**
 * The fence's language, read off the `language-*` class or `data-language`
 * attribute. rehype-highlight wrote `language-*` on the inner `<code>`;
 * rehype-pretty-code (shiki) writes `data-language` on both `<pre>` and
 * `<code>` and removes the class. Handle both, and return null for the
 * handful of bare ``` fences in the archive.
 */
export function codeLanguage(node: ReactNode): string | null {
  if (!node || typeof node !== "object" || !("props" in node)) return null;
  const props = node.props as Record<string, unknown>;
  if (!props || typeof props !== "object") return null;

  // 1) shiki / rehype-pretty-code: data-language="js"
  const dataLang =
    (props["data-language"] as unknown) ?? (props["dataLanguage"] as unknown);
  if (typeof dataLang === "string" && dataLang) {
    const token = dataLang.toLowerCase();
    return (
      LANGUAGE_NAMES[token] ?? token.charAt(0).toUpperCase() + token.slice(1)
    );
  }

  // 2) fallback: language-* class (string or array) from rehype-highlight or raw MDX
  const className = props["className"] as unknown;
  let classStr: string | null = null;
  if (typeof className === "string") classStr = className;
  else if (Array.isArray(className))
    classStr = (className as unknown[]).filter((c) => typeof c === "string").join(" ");

  if (typeof classStr === "string") {
    const match = /(?:^|\s)language-([\w+-]+)/.exec(classStr);
    if (match) {
      const token = match[1].toLowerCase();
      return (
        LANGUAGE_NAMES[token] ?? token.charAt(0).toUpperCase() + token.slice(1)
      );
    }
  }

  return null;
}
