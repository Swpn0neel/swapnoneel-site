import { getCollection, type CollectionEntry } from "astro:content";
import fs from "node:fs";
import path from "node:path";

/**
 * Replaces lib/md.ts. That module walked `md/` with fs on every call and
 * wrapped the results in React.cache() to stop the walk happening once per
 * component; the content layer does both jobs, so the recursion, the
 * path-traversal guard and the cache wrappers are all gone.
 *
 * What is kept from it: the narration-derived reading time, the word count,
 * and the range-aware date sort for work entries — all real behaviour rather
 * than framework plumbing.
 */

export type BlogEntry = CollectionEntry<"blog">;
export type ProjectEntry = CollectionEntry<"projects">;
export type WorkEntry = CollectionEntry<"work">;

function countWords(markdown: string): number {
  const text = markdown.replace(/[#*`\[\]()>!|~-]/g, "").trim();
  return text.split(/\s+/).filter(Boolean).length;
}

/**
 * Reading time tracks the actual pre-generated narration (Edge TTS) audio
 * length rather than a words-per-minute guess, since that is the real time a
 * reader spends with the post either way.
 *
 * The manifest is filed under the post's own publish year, which is not
 * necessarily the year directory the markdown sits in — see yearOf() in
 * scripts/generate-narrations.mjs. Returns null when a post has no narration
 * yet, and the caller omits the figure rather than inventing one.
 */
function narrationDurationMs(slug: string, publishedAt: Date): number | null {
  const file = path.join(
    process.cwd(),
    "public",
    "narration",
    String(publishedAt.getFullYear()),
    `${slug}.json`
  );
  if (!fs.existsSync(file)) return null;
  try {
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    return typeof data.durationMs === "number" ? data.durationMs : null;
  } catch {
    return null;
  }
}

export type BlogSummary = {
  entry: BlogEntry;
  slug: string;
  title: string;
  description: string;
  publishedAt: Date;
  updatedAt?: Date;
  cover: string;
  tags: string[];
  brand?: string;
  /** Cross-post URLs, normalised to an array. */
  urls: string[];
  wordCount: number;
  /** Minutes, from the narration audio. Undefined when there is no narration. */
  readingTime?: number;
};

export function summarise(entry: BlogEntry): BlogSummary {
  const { data, body } = entry;
  const durationMs = narrationDurationMs(entry.id, data.date);
  return {
    entry,
    slug: entry.id,
    title: data.title,
    description: data.description,
    publishedAt: data.date,
    updatedAt: data.updated,
    cover: data.cover,
    tags: data.tags,
    brand: data.brand,
    urls: data.link ? (Array.isArray(data.link) ? data.link : [data.link]) : [],
    wordCount: countWords(body ?? ""),
    readingTime:
      durationMs === null ? undefined : Math.max(1, Math.round(durationMs / 60000)),
  };
}

/** Newest first. */
export async function getBlogPosts(): Promise<BlogSummary[]> {
  const posts = await getCollection("blog");
  return posts
    .map(summarise)
    .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
}

/**
 * Sorts on the start of a human-readable range: "Jan 2024 - May 2024" sorts by
 * "Jan 2024", and an open-ended "May 2023 - Present" sorts as current so the
 * present role stays at the top.
 */
function rangeStart(value: string): number {
  if (!value) return 0;
  const start = value.split(/[-–]/)[0].trim();
  if (start.toLowerCase() === "present") return Date.now();
  const date = new Date(start);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

/** Newest first, by the start of each range. */
export async function getWorkItems(): Promise<WorkEntry[]> {
  const items = await getCollection("work");
  return items.sort((a, b) => rangeStart(b.data.date) - rangeStart(a.data.date));
}

/** Newest first, excluding hidden entries. */
export async function getProjects(): Promise<ProjectEntry[]> {
  const projects = await getCollection("projects", ({ data }) => !data.hidden);
  return projects.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

const FEATURED_FALLBACK_COUNT = 5;

/**
 * Falls back to the newest few rather than returning nothing: an empty result
 * would render the homepage showcase as an empty carousel above an empty list,
 * and the only way to cause that is to forget the flag on a new project.
 */
export async function getFeaturedProjects(): Promise<ProjectEntry[]> {
  const projects = await getProjects();
  const featured = projects.filter((p) => p.data.featured);
  return featured.length > 0 ? featured : projects.slice(0, FEATURED_FALLBACK_COUNT);
}
