import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { defineCollection } from "astro:content";
import path from "node:path";

/**
 * Posts are filed under a year directory (`blog/2026/my-post.md`) but the year
 * has never been part of the URL — the post serves at `/blog/my-post`. The
 * glob loader's default id is the path relative to `base`, which would make it
 * `2026/my-post` and silently change every blog URL on the site.
 *
 * Seven posts also carry an explicit `slug` in their frontmatter, which Astro
 * honours ahead of this function. All seven happen to equal their filename, so
 * the two paths agree; this is here for the other thirty-eight.
 */
const filenameId = ({ entry }: { entry: string }) =>
  path.basename(entry).replace(/\.mdx?$/, "");

const blog = defineCollection({
  loader: glob({
    pattern: "**/*.{md,mdx}",
    base: "./src/content/blog",
    generateId: filenameId,
  }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      // Every post's date is a full ISO timestamp, so coercion is safe here.
      // `work` is the collection where it is not — see below.
      date: z.coerce.date(),
      updated: z.coerce.date().optional(),
      description: z.string(),
      /**
       * A path relative to the post, resolved by Astro into ImageMetadata so the
       * cover is optimised and carries its real dimensions. These used to be
       * remote URLs mapped through lib/blog-images.json at render time; the
       * images now live in src/assets/blog-img and the mapping is gone.
       */
      cover: image(),
      /** Cross-post URLs. A string for one, an array once a post is syndicated twice. */
      link: z.union([z.string(), z.array(z.string())]).optional(),
      tags: z.array(z.string()).default([]),
      /** Company accent key for posts with no cross-post URL — see lib/blog-brand. */
      brand: z.string().optional(),
      /** Present on seven posts; see filenameId above. */
      slug: z.string().optional(),
    }),
});

const projects = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/projects" }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string(),
    cover: z.string(),
    link: z.string(),
    /** Promotes the project into the homepage showcase. */
    featured: z.boolean().default(false),
    /** Keeps the record but drops it from every listing and the sitemap. */
    hidden: z.boolean().default(false),
  }),
});

const work = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/work" }),
  schema: z.object({
    title: z.string(),
    /**
     * A human-readable range, not a date: "May 2024 - Jan 2025",
     * "May 2023 - Present". Deliberately not coerced — it is rendered verbatim,
     * and sorting reads the start of the range (see sortByRangeStart in
     * lib/content.ts).
     */
    date: z.string(),
    description: z.string(),
    cover: z.string(),
    /**
     * No work entry uses this today, but ExperienceSection has always branched
     * on it: an entry with a link points straight at the company instead of at
     * its own detail page. Declared so that behaviour stays reachable.
     */
    link: z.union([z.string(), z.array(z.string())]).optional(),
  }),
});

export const collections = { blog, projects, work };
