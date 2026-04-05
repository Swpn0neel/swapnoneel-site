import fs from "fs";
import matter from "gray-matter";
import path from "path";

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

export function readBySlug(
  folder: string,
  slug: string
): { meta: PostMeta; content: string } | null {
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

function getAll(folder: string): { meta: PostMeta; content: string }[] {
  return getAllSlugs(folder)
    .map((slug) => readBySlug(folder, slug))
    .filter(Boolean) as { meta: PostMeta; content: string }[];
}

export const getAllBlogPosts = () =>
  getAll("blog").sort(
    (a, b) =>
      new Date(b.meta.date).getTime() - new Date(a.meta.date).getTime()
  );

export const getBlogPost = (slug: string) => readBySlug("blog", slug);

export const getAllWorkItems = () =>
  getAll("work").sort(
    (a, b) =>
      new Date(b.meta.date).getTime() - new Date(a.meta.date).getTime()
  );

export const getWorkItem = (slug: string) =>
  readBySlug("work", slug) ?? readBySlug("projects", slug);

export const getAllProjects = () =>
  getAll("projects").sort(
    (a, b) =>
      new Date(b.meta.date).getTime() - new Date(a.meta.date).getTime()
  );
