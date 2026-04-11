import fs from "fs";
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

function getAllSlugs(folder: string): string[] {
  const dir = path.join(mdDir, folder);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md") || f.endsWith(".mdx"))
    .map((f) => f.replace(/\.mdx?$/, ""));
}

export const readBySlug = cache(
  (
    folder: string,
    slug: string
  ): { meta: PostMeta; content: string } | null => {
    const mdPath = path.join(mdDir, folder, `${slug}.md`);
    const mdxPath = path.join(mdDir, folder, `${slug}.mdx`);
    const filePath = fs.existsSync(mdPath)
      ? mdPath
      : fs.existsSync(mdxPath)
        ? mdxPath
        : null;
    if (!filePath) return null;
    const raw = fs.readFileSync(filePath, "utf8");
    const { data, content } = matter(raw);
    return {
      meta: { slug, ...(data as Omit<PostMeta, "slug">) },
      content,
    };
  }
);

const getAll = cache(
  (folder: string): { meta: PostMeta; content: string }[] => {
    return getAllSlugs(folder)
      .map((slug) => readBySlug(folder, slug))
      .filter(Boolean) as { meta: PostMeta; content: string }[];
  }
);

function parseDate(dateStr: string): number {
  if (!dateStr) return 0;

  // Handle ranges like "Jan 2024 - May 2024" or "May 2023 - Present"
  // We sort by start date (the first part of the range)
  const parts = dateStr.split(/[-–]/);
  const startDateStr = parts[0].trim();

  if (startDateStr.toLowerCase() === "present") {
    return Date.now();
  }

  const date = new Date(startDateStr);
  return isNaN(date.getTime()) ? 0 : date.getTime();
}

export const getAllBlogPosts = cache(() =>
  getAll("blog").sort((a, b) => parseDate(b.meta.date) - parseDate(a.meta.date))
);

export const getBlogPost = cache((slug: string) => readBySlug("blog", slug));

export const getAllWorkItems = cache(() =>
  getAll("work").sort((a, b) => parseDate(b.meta.date) - parseDate(a.meta.date))
);

export const getWorkItem = cache(
  (slug: string) => readBySlug("work", slug) ?? readBySlug("projects", slug)
);

export const getAllProjects = cache(() =>
  getAll("projects").sort(
    (a, b) => parseDate(b.meta.date) - parseDate(a.meta.date)
  )
);
