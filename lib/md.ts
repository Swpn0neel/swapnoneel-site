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
  updated?: string;
  description?: string;
  cover?: string;
  link?: string | string[];
  tags?: string[];
  /** Company accent key for posts with no cross-post URL — see lib/blog-brand. */
  brand?: string;
  /** Includes the project in the homepage showcase. */
  featured?: boolean;
  // Keeps the markdown record but drops the item from every listing
  // (home carousel, work grid, resume, sitemap, static params).
  hidden?: boolean;
};

function getFilesRecursively(dir: string): string[] {
  let results: string[] = [];
  if (!fs.existsSync(dir)) return [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFilesRecursively(filePath));
    } else if (file.endsWith(".md") || file.endsWith(".mdx")) {
      results.push(filePath);
    }
  }
  return results;
}

function getAllSlugs(folder: string): string[] {
  const dir = path.join(mdDir, folder);
  if (!isPathSafe(dir) || !fs.existsSync(dir)) return [];
  return getFilesRecursively(dir).map((filePath) =>
    path.basename(filePath).replace(/\.mdx?$/, "")
  );
}

export function readBySlug(
  folder: string,
  slug: string
): { meta: PostMeta; content: string } | null {
  const dir = path.join(mdDir, folder);
  if (!isPathSafe(dir) || !fs.existsSync(dir)) return null;

  const findFileRecursively = (currentDir: string): string | null => {
    const list = fs.readdirSync(currentDir);
    for (const file of list) {
      const filePath = path.join(currentDir, file);
      const stat = fs.statSync(filePath);
      if (stat && stat.isDirectory()) {
        const found = findFileRecursively(filePath);
        if (found) return found;
      } else if (
        (file === `${slug}.md` || file === `${slug}.mdx`) &&
        isPathSafe(filePath)
      ) {
        return filePath;
      }
    }
    return null;
  };

  const filePath = findFileRecursively(dir);
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

function countWords(markdown: string): number {
  const text = markdown.replace(/[#*`\[\]()>!|~-]/g, "").trim();
  return text.split(/\s+/).filter(Boolean).length;
}

// Reading time now tracks the actual pre-generated narration (Edge TTS)
// audio length instead of a words-per-minute guess, since that's the real
// time a reader spends with the post either way.
function getNarrationDurationMs(
  slug: string,
  publishedAt: string
): number | null {
  const year = new Date(publishedAt).getFullYear();
  const narrationPath = path.join(
    process.cwd(),
    "public",
    "narration",
    String(year),
    `${slug}.json`
  );
  if (!fs.existsSync(narrationPath)) return null;
  try {
    const data = JSON.parse(fs.readFileSync(narrationPath, "utf8"));
    return typeof data.durationMs === "number" ? data.durationMs : null;
  } catch {
    return null;
  }
}

function readingTimeFromDurationMs(durationMs: number): number {
  return Math.max(1, Math.round(durationMs / 60000));
}

export type BlogPost = {
  title: string;
  slug: string;
  publishedAt: string;
  updatedAt?: string;
  brief?: string;
  cover?: string;
  content?: {
    markdown: string;
  };
  urls?: string[];
  readingTime?: number;
  wordCount?: number;
  tags?: string[];
  brand?: string;
};

export const getBlogPost = cache((slug: string): BlogPost | null => {
  const post = readBySlug("blog", slug);
  if (!post) return null;
  const wordCount = countWords(post.content);
  const narrationDurationMs = getNarrationDurationMs(
    post.meta.slug,
    post.meta.date
  );
  return {
    title: post.meta.title,
    slug: post.meta.slug,
    publishedAt: post.meta.date,
    updatedAt: post.meta.updated,
    brief: post.meta.description,
    cover: post.meta.cover,
    content: {
      markdown: post.content,
    },
    urls: post.meta.link
      ? Array.isArray(post.meta.link)
        ? post.meta.link
        : [post.meta.link]
      : undefined,
    readingTime:
      narrationDurationMs !== null
        ? readingTimeFromDurationMs(narrationDurationMs)
        : undefined,
    wordCount,
    tags: post.meta.tags,
    brand: post.meta.brand,
  };
});

export const getAllBlogPosts = cache((): BlogPost[] => {
  return getAllSlugs("blog")
    .map((slug) => getBlogPost(slug))
    .filter(Boolean)
    .sort(
      (a, b) =>
        new Date(b!.publishedAt).getTime() - new Date(a!.publishedAt).getTime()
    ) as BlogPost[];
});

export const getAllWorkItems = () =>
  getAll("work")
    .map((item) => ({ item, dateValue: parseDate(item.meta.date) }))
    .sort((a, b) => b.dateValue - a.dateValue)
    .map(({ item }) => item);

export const getWorkItem = cache(
  (slug: string) => readBySlug("work", slug) ?? readBySlug("projects", slug)
);

export const getAllProjects = () =>
  getAll("projects")
    .filter((item) => !item.meta.hidden)
    .map((item) => ({ item, dateValue: parseDate(item.meta.date) }))
    .sort((a, b) => b.dateValue - a.dateValue)
    .map(({ item }) => item);

const FEATURED_FALLBACK_COUNT = 5;

// Falls back to the newest few rather than returning nothing: an empty result
// would render the homepage showcase as an empty carousel (Embla initialising
// with zero slides) above an empty list, and the only way to cause that is to
// forget the flag on a new project.
export const getFeaturedProjects = () => {
  const projects = getAllProjects();
  const featured = projects.filter((item) => item.meta.featured === true);
  return featured.length > 0
    ? featured
    : projects.slice(0, FEATURED_FALLBACK_COUNT);
};
