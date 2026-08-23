import {
  appendVaryAccept,
  canonicalPathFromMarkdown,
  markdownSiblingPath,
  preferredContentType,
} from "@/lib/content-negotiation";
import { NextRequest, NextResponse } from "next/server";

function markdownRewrite(
  request: NextRequest,
  canonicalPath: string,
  explicitSibling: boolean
): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname =
    canonicalPath === "/" ? "/api/markdown" : `/api/markdown${canonicalPath}`;

  const requestHeaders = new Headers(request.headers);
  if (explicitSibling) requestHeaders.set("x-markdown-sibling", "1");

  const response = NextResponse.rewrite(url, {
    request: { headers: requestHeaders },
  });
  appendVaryAccept(response.headers);
  return response;
}

export function proxy(request: NextRequest) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return NextResponse.next();
  }

  const pathname = request.nextUrl.pathname;

  // This is a literal public instruction file, not a negotiated page sibling.
  if (pathname === "/agent-instructions.md") return NextResponse.next();

  const canonicalMarkdownPath = canonicalPathFromMarkdown(pathname);
  if (canonicalMarkdownPath !== null) {
    return markdownRewrite(request, canonicalMarkdownPath, true);
  }

  const accept = request.headers.get("accept");
  const preferred = preferredContentType(accept);
  if (preferred === "text/markdown") {
    return markdownRewrite(request, pathname, false);
  }

  if (preferred === null && accept) {
    return new NextResponse(
      "Not Acceptable\n\nAvailable representations: text/html, text/markdown\n",
      {
        status: 406,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          Vary: "Accept, Accept-Encoding",
        },
      }
    );
  }

  const response = NextResponse.next();
  appendVaryAccept(response.headers);
  response.headers.append(
    "Link",
    `<${new URL(markdownSiblingPath(pathname), request.url).toString()}>; rel="alternate"; type="text/markdown"`
  );
  return response;
}

export const config = {
  matcher: [
    "/((?!api/|_next/|_vercel/|agent-instructions\\.md$|.*\\.(?:avif|webp|png|jpe?g|gif|svg|ico|css|js|map|woff2?|ttf|mp3|txt|xml|json)$).*)",
  ],
};
