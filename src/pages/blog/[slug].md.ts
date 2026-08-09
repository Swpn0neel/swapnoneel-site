import type { APIRoute, GetStaticPaths } from "astro";
import { getCollection } from "astro:content";
import fs from "node:fs/promises";

/**
 * The raw markdown for a post, at /blog/<slug>.md.
 *
 * Next served this from an API route plus a rewrite in next.config.ts, because
 * a .md URL is not a page. Astro builds it as a static file: same URL, no
 * route rewrite, no function.
 *
 * `entry.body` is the parsed body with frontmatter stripped, so the file is
 * read from disk to hand back exactly what the author wrote.
 */
export const getStaticPaths: GetStaticPaths = async () => {
  const posts = await getCollection("blog");
  return posts.map((entry) => ({ params: { slug: entry.id }, props: { entry } }));
};

export const GET: APIRoute = async ({ props }) => {
  const { entry } = props as { entry: { filePath?: string; body?: string } };
  const raw = entry.filePath
    ? await fs.readFile(entry.filePath, "utf8")
    : (entry.body ?? "");

  return new Response(raw, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
};
