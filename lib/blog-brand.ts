// Posts written for a company's blog get that company's accent on hover in the
// listing, so a reader can tell at a glance which posts were client work.
//
// Syndicated posts are identified by their cross-post URL, but posts published
// only here have no URL to read, so those declare `brand: <key>` in frontmatter
// instead.
export const BRAND_COLORS: Record<string, string> = {
  keploy: "#FF914D",
  // Maxim AI / Bifrost green, sampled from their own brand assets.
  maxim: "#27B494",
};

export function brandColor(post: {
  brand?: string;
  urls?: string[];
}): string | undefined {
  if (post.brand && BRAND_COLORS[post.brand]) return BRAND_COLORS[post.brand];
  const matched = Object.keys(BRAND_COLORS).find((key) =>
    post.urls?.some((url) => url.includes(key))
  );
  return matched ? BRAND_COLORS[matched] : undefined;
}
