import fs from "fs/promises";
import matter from "gray-matter";
import path from "path";
import { cache } from "react";

const mdDir = path.join(process.cwd(), "md");

export type PostMeta = {
  slug: string;
  title: string;
  date: string;
  description?: string;
  cover?: string;
  link?: string;
};

const getAllSlugs = cache(async (folder: string): Promise<string[]> => {
  const dir = path.join(mdDir, folder);
  try {
    const files = await fs.readdir(dir);
    return files
      .filter((f) => f.endsWith(".md") || f.endsWith(".mdx"))
      .map((f) => f.replace(/\.mdx?$/, ""));
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      err.code === "ENOENT"
    )
      return [];
    throw err;
  }
});

export const readBySlug = cache(
  async (
    folder: string,
    slug: string
  ): Promise<{ meta: PostMeta; content: string } | null> => {
    let raw: string;
    try {
      const mdPath = path.join(mdDir, folder, `${slug}.md`);
      raw = await fs.readFile(mdPath, "utf8");
    } catch (err: unknown) {
      if (
        err &&
        typeof err === "object" &&
        "code" in err &&
        err.code !== "ENOENT"
      )
        throw err;
      try {
        const mdxPath = path.join(mdDir, folder, `${slug}.mdx`);
        raw = await fs.readFile(mdxPath, "utf8");
      } catch (err2: unknown) {
        if (
          err2 &&
          typeof err2 === "object" &&
          "code" in err2 &&
          err2.code !== "ENOENT"
        )
          throw err2;
        return null;
      }
    }
    const { data, content } = matter(raw);
    return {
      meta: { slug, ...(data as Omit<PostMeta, "slug">) },
      content,
    };
  }
);

const getAll = cache(
  async (folder: string): Promise<{ meta: PostMeta; content: string }[]> => {
    const slugs = await getAllSlugs(folder);
    const items = await Promise.all(
      slugs.map((slug) => readBySlug(folder, slug))
    );
    return items.filter(Boolean) as { meta: PostMeta; content: string }[];
  }
);

const parseDateCache = new Map<string, number>();

function parseDate(dateStr: string): number {
  if (!dateStr) return 0;

  if (parseDateCache.has(dateStr)) {
    return parseDateCache.get(dateStr)!;
  }

  let result = 0;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const date = new Date(dateStr);
    result = isNaN(date.getTime()) ? 0 : date.getTime();
  } else {
    const parts = dateStr.split(/[-–]/);
    const startDateStr = parts[0].trim();

    if (startDateStr.toLowerCase() === "present") {
      result = Date.now();
    } else {
      const date = new Date(startDateStr);
      result = isNaN(date.getTime()) ? 0 : date.getTime();
    }
  }

  parseDateCache.set(dateStr, result);
  return result;
}

export const getBlogPost = async (slug: string) => readBySlug("blog", slug);

export const getAllWorkItems = cache(async () => {
  const items = await getAll("work");
  return items
    .map((item) => [item, parseDate(item.meta.date)] as const)
    .sort((a, b) => b[1] - a[1])
    .map(([item]) => item);
});

export const getWorkItem = cache(async (slug: string) => {
  const workItem = await readBySlug("work", slug);
  if (workItem) return workItem;
  return await readBySlug("projects", slug);
});

export const getAllProjects = cache(async () => {
  const items = await getAll("projects");
  return items
    .map((item) => [item, parseDate(item.meta.date)] as const)
    .sort((a, b) => b[1] - a[1])
    .map(([item]) => item);
});
