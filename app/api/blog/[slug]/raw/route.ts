import { getBlogSourcePath } from "@/lib/md";
import fs from "fs";
import path from "path";

const NOT_FOUND_HEADERS = { "Content-Type": "text/plain; charset=utf-8" };

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // Resolved from the generated content layer rather than by walking md/blog.
  // The old recursive readdir/stat search built its paths at runtime, which the
  // output tracer cannot follow — it gave up and bundled 2,480 files into this
  // function, all of public/ and a stale dist/ included, to read one file.
  // A slug that is not in the manifest never becomes a path at all, which also
  // makes the traversal check the old code needed unnecessary.
  const relativePath = getBlogSourcePath(slug);
  if (!relativePath) {
    return new Response(
      `# 404 — Not Found\n\nNo blog post with slug: \`${slug}\``,
      { status: 404, headers: NOT_FOUND_HEADERS }
    );
  }

  let raw: string;
  try {
    raw = fs.readFileSync(path.join(process.cwd(), "md", relativePath), "utf8");
  } catch {
    return new Response(
      `# 404 — Not Found\n\nNo blog post with slug: \`${slug}\``,
      { status: 404, headers: NOT_FOUND_HEADERS }
    );
  }

  return new Response(raw, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
