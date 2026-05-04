import fs from "fs";
import matter from "gray-matter";
import path from "path";
import { cache } from "react";

const mdDir = path.join(process.cwd(), "md");

function isPathSafe(filePath: string): boolean {
  const relative = path.relative(mdDir, filePath);
  return !relative.startsWith("..") && !path.isAbsolute(relative);
}

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
  if (!isPathSafe(dir) || !fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md") || f.endsWith(".mdx"))
    .map((f) => f.replace(/\.mdx?$/, ""));
}

export function readBySlug(
  folder: string,
  slug: string
): { meta: PostMeta; content: string } | null {
  const mdPath = path.join(mdDir, folder, `${slug}.md`);
  const mdxPath = path.join(mdDir, folder, `${slug}.mdx`);

  if (!isPathSafe(mdPath) || !isPathSafe(mdxPath)) return null;

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

function getAll(folder: string): { meta: PostMeta; content: string }[] {
  return getAllSlugs(folder)
    .map((slug) => readBySlug(folder, slug))
    .filter(Boolean) as { meta: PostMeta; content: string }[];
}

function parseDate(dateStr: string): number {
  if (!dateStr) return 0;

  // If it's a full ISO date (YYYY-MM-DD), don't split it
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? 0 : date.getTime();
  }

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

export const getBlogPost = cache((slug: string) => readBySlug("blog", slug));

export const getAllWorkItems = () =>
  getAll("work")
    .map((item) => ({ item, dateValue: parseDate(item.meta.date) }))
    .sort((a, b) => b.dateValue - a.dateValue)
    .map(({ item }) => item);

export const getWorkItem = cache((slug: string) =>
  readBySlug("work", slug) ?? readBySlug("projects", slug)
);

export const getAllProjects = () =>
  getAll("projects")
    .map((item) => ({ item, dateValue: parseDate(item.meta.date) }))
    .sort((a, b) => b.dateValue - a.dateValue)
    .map(({ item }) => item);
