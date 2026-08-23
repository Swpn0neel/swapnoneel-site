export const PRODUCED_CONTENT_TYPES = ["text/html", "text/markdown"] as const;

export type ProducedContentType = (typeof PRODUCED_CONTENT_TYPES)[number];

type AcceptEntry = {
  type: string;
  q: number;
  specificity: number;
  position: number;
};

function parseAccept(header: string): AcceptEntry[] {
  return header
    .split(",")
    .map((raw, position) => {
      const parts = raw
        .trim()
        .split(";")
        .map((part) => part.trim());
      const type = (parts[0] ?? "").toLowerCase();
      let q = 1;

      for (const parameter of parts.slice(1)) {
        const [rawName, rawValue] = parameter
          .split("=")
          .map((part) => part.trim());
        if (rawName?.toLowerCase() !== "q") continue;
        const parsed = Number(rawValue);
        if (!Number.isNaN(parsed)) q = Math.max(0, Math.min(1, parsed));
      }

      const specificity = type === "*/*" ? 0 : type.endsWith("/*") ? 1 : 2;
      return { type, q, specificity, position };
    })
    .filter((entry) => entry.type.length > 0);
}

function matches(entry: AcceptEntry, candidate: ProducedContentType): boolean {
  if (entry.type === "*/*") return true;
  if (entry.type.endsWith("/*")) {
    return candidate.startsWith(entry.type.slice(0, -1));
  }
  return entry.type === candidate;
}

/**
 * Selects between the site's HTML and Markdown representations using the
 * precedence rules in RFC 9110 section 12.5.1. A null result means the client
 * explicitly rejected every representation the site can produce.
 */
export function preferredContentType(
  header: string | null
): ProducedContentType | null {
  if (!header) return PRODUCED_CONTENT_TYPES[0];

  const entries = parseAccept(header);
  if (entries.length === 0) return PRODUCED_CONTENT_TYPES[0];

  let bestType: ProducedContentType | null = null;
  let bestQ = -1;
  let bestPosition = Number.POSITIVE_INFINITY;

  for (const candidate of PRODUCED_CONTENT_TYPES) {
    let matched: AcceptEntry | null = null;

    for (const entry of entries) {
      if (!matches(entry, candidate)) continue;
      if (
        matched === null ||
        entry.specificity > matched.specificity ||
        (entry.specificity === matched.specificity &&
          entry.position < matched.position)
      ) {
        matched = entry;
      }
    }

    if (!matched || matched.q <= 0) continue;
    if (
      matched.q > bestQ ||
      (matched.q === bestQ && matched.position < bestPosition)
    ) {
      bestType = candidate;
      bestQ = matched.q;
      bestPosition = matched.position;
    }
  }

  return bestType;
}

export function appendVaryAccept(headers: Headers): void {
  const existing = headers.get("Vary");
  if (!existing) {
    headers.set("Vary", "Accept");
    return;
  }

  const tokens = existing.split(",").map((token) => token.trim().toLowerCase());
  if (!tokens.includes("accept")) headers.set("Vary", `${existing}, Accept`);
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
