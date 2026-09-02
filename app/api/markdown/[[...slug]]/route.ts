import { getMarkdownRepresentation } from "@/lib/markdown-representations";
import type { NextRequest } from "next/server";

const BASE_URL = "https://www.swapnoneel.site";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug?: string[] }> }
) {
  const { slug = [] } = await params;
  const pathname = `/${slug.join("/")}`;
  const representation = getMarkdownRepresentation(pathname);
  const canonicalUrl = new URL(representation.canonicalPath, BASE_URL);

  return new Response(`${representation.body.trim()}\n`, {
    status: representation.status,
    headers: {
      "Cache-Control":
        representation.status === 404
          ? "no-store"
          : "public, s-maxage=300, stale-while-revalidate=86400",
      "Content-Location": canonicalUrl.toString(),
      "Content-Type": "text/markdown; charset=utf-8",
      Link: `<${canonicalUrl.toString()}>; rel="canonical"; type="text/html"`,
      Vary: "Accept, Accept-Encoding",
      // Explicit .md siblings get their noindex from next.config.ts headers(),
      // matched on the URL the client requested; this route only sees the
      // rewritten path.
      ...(representation.status === 404 ? { "X-Robots-Tag": "noindex" } : {}),
    },
  });
}
