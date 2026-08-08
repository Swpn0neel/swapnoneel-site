import { brandColor } from "@/lib/blog-brand";
import { getAllBlogPosts, type BlogPost } from "@/lib/md";
import { cache } from "react";

export type RelatedPost = {
  slug: string;
  title: string;
  publishedAt: string;
  brief?: string;
  accent?: string;
};

const DEFAULT_LIMIT = 3;

// How many posts carry each tag. Every post here is tagged, but the tags are
// wildly uneven — `programming` is on 16 of 45 while `chaos-engineering` is on
// exactly one — so a raw count of shared tags would rank a generic pairing
// (two posts that happen to both be about programming) above a specific one.
function tagDocumentFrequency(posts: BlogPost[]): Map<string, number> {
  const frequency = new Map<string, number>();
  for (const post of posts) {
    for (const tag of new Set(post.tags ?? [])) {
      frequency.set(tag, (frequency.get(tag) ?? 0) + 1);
    }
  }
  return frequency;
}

// Inverse document frequency: a tag shared by two posts out of 45 is worth
// ln(22.5) ≈ 3.1, one shared by 16 is worth ln(2.8) ≈ 1.0, and a tag every
// post carries is worth exactly 0 — it says nothing about relatedness.
function relatednessScore(
  ownTags: Set<string>,
  candidateTags: string[] | undefined,
  frequency: Map<string, number>,
  total: number
): number {
  let score = 0;
  for (const tag of new Set(candidateTags ?? [])) {
    if (!ownTags.has(tag)) continue;
    score += Math.log(total / (frequency.get(tag) ?? 1));
  }
  return score;
}

function toRelated(post: BlogPost): RelatedPost {
  return {
    slug: post.slug,
    title: post.title,
    publishedAt: post.publishedAt,
    brief: post.brief,
    accent: brandColor({ brand: post.brand, urls: post.urls }),
  };
}

/**
 * Posts to offer a reader who has just finished `slug`, best match first.
 *
 * Ranked by IDF-weighted tag overlap and broken by recency. If the post is too
 * niche to have `limit` tagged neighbours, the remainder is topped up with the
 * newest other posts — the end of an article should never be a dead end, even
 * for a one-of-a-kind post.
 */
export const getRelatedPosts = cache(
  (slug: string, limit: number = DEFAULT_LIMIT): RelatedPost[] => {
    // Newest first, which is the tie-break order the sort below preserves.
    const posts = getAllBlogPosts();
    const current = posts.find((post) => post.slug === slug);
    if (!current) return [];

    const candidates = posts.filter((post) => post.slug !== slug);
    const frequency = tagDocumentFrequency(posts);
    const ownTags = new Set(current.tags ?? []);

    const scored = candidates
      .map((post) => ({
        post,
        score: relatednessScore(ownTags, post.tags, frequency, posts.length),
      }))
      .filter(({ score }) => score > 0)
      // Stable sort keeps the newest-first input order for equal scores.
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ post }) => post);

    if (scored.length >= limit) return scored.map(toRelated);

    const picked = new Set(scored.map((post) => post.slug));
    const filler = candidates
      .filter((post) => !picked.has(post.slug))
      .slice(0, limit - scored.length);

    return [...scored, ...filler].map(toRelated);
  }
);
