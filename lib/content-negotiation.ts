/**
 * The site's Markdown representation is selected in next.config.ts, not in
 * middleware. A middleware ran in front of every HTML request purely to read
 * the Accept header; a header-conditioned rewrite does the same routing in the
 * platform's routing layer with no function invocation, so the static HTML is
 * served straight from the CDN cache again.
 *
 * `has.value` in a Next rewrite is a regular expression that Next anchors as
 * ^…$, so the whole thing is one non-capturing group. Markdown is chosen when
 *
 *   - text/markdown is listed and not rejected, and text/html is either
 *     absent or rejected; or
 *   - text/html is rejected and a wildcard (*​/​* or text/*) is accepted.
 *
 * "Rejected" is a q=0 weight on the range, the one RFC 9110 mechanism for
 * excluding a representation. The weight follows any media-type parameters
 * (`text/markdown;charset=utf-8;q=0` is a rejection too), so the pattern skips
 * parameters that are not `q=` before looking for it; anything after the
 * weight is an accept extension and does not matter. A client listing both
 * types with non-zero q gets HTML regardless of order; the middleware weighed
 * q-values against each other, but a regex cannot, and every browser lands in
 * the HTML branch either way.
 */
const REJECTED = String.raw`(?:\s*;\s*(?!q=)[^;,]*)*\s*;\s*q=0(?:\.0+)?\s*(?:[,;]|$)`;
const wanted = (type: string) => `${type}(?!${REJECTED})`;

export const MARKDOWN_ACCEPT_PATTERN =
  `(?:(?!.*${wanted("text/html")}).*${wanted("text/markdown")}.*` +
  `|(?=.*text/html${REJECTED}).*(?:${wanted(String.raw`\*/\*`)}|${wanted(String.raw`text/\*`)}).*)`;

export function acceptsMarkdownOnly(accept: string | null): boolean {
  if (accept === null) return false;
  return new RegExp(`^${MARKDOWN_ACCEPT_PATTERN}$`, "s").test(accept);
}

/**
 * Body of the `:path(...)` parameter used by the negotiation rewrite and the
 * alternate-link header in next.config.ts: any page path, but never the API,
 * the framework's own routes, or a file with an extension — the same set the
 * middleware matcher used to exclude.
 */
export const PAGE_PATH_PATTERN =
  "(?!api/|_next/|_vercel/)(?!.*\\.[A-Za-z0-9]+$).+";

export function isNegotiablePagePath(pathname: string): boolean {
  return new RegExp(`^/(?:${PAGE_PATH_PATTERN})$`).test(pathname);
}

export function markdownSiblingPath(pathname: string): string {
  return pathname === "/" ? "/index.md" : `${pathname.replace(/\/$/, "")}.md`;
}

export function canonicalPathFromMarkdown(pathname: string): string | null {
  if (pathname === "/index.md") return "/";
  if (!pathname.endsWith(".md")) return null;
  const canonical = pathname.slice(0, -3);
  return canonical || "/";
}
