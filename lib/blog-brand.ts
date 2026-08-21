// Posts written for a company's blog get that company's accent on hover in the
// listing, so a reader can tell at a glance which posts were client work.
//
// Syndicated posts are identified by their cross-post URL, but posts published
// only here have no URL to read, so those declare `brand: <key>` in frontmatter
// instead.
const BRAND_COLORS: Record<string, string> = {
  keploy: "#FF914D",
  // Maxim AI / Bifrost green, sampled from their own brand assets.
  maxim: "#27B494",
};

const BRAND_HOST_MAP: Record<string, string> = {
  "keploy.io": "keploy",
  "getmaxim.ai": "maxim",
};

function hostMatches(host: string, domain: string): boolean {
  return host === domain || host.endsWith(`.${domain}`);
}

function isBifrostHost(host: string): boolean {
  const labels = host.split(".");
  for (const label of labels) {
    if (label === "bifrost") return true;
  }
  return false;
}

export function brandColor(post: {
  brand?: string;
  urls?: string[];
}): string | undefined {
  if (post.brand && BRAND_COLORS[post.brand]) return BRAND_COLORS[post.brand];
  if (!post.urls || post.urls.length === 0) return undefined;
  for (const raw of post.urls) {
    try {
      const host = new URL(raw).hostname.toLowerCase();
      for (const [domain, brandKey] of Object.entries(BRAND_HOST_MAP)) {
        if (hostMatches(host, domain)) {
          const color = BRAND_COLORS[brandKey];
          if (color) return color;
        }
      }
      if (isBifrostHost(host)) {
        const color = BRAND_COLORS["maxim"];
        if (color) return color;
      }
    } catch {
      // ignore malformed URLs
    }
  }
  return undefined;
}

const CROSS_POST_MAP: Record<string, { label: string; className: string }> = {
  "keploy.io": {
    label: "Keploy Blogs",
    className: "text-[#C2410C] dark:text-[#FB923C]",
  },
  "dev.to": {
    label: "DEV.to",
    className: "text-[#3B49DF] dark:text-[#818CF8]",
  },
  "medium.com": {
    label: "Medium",
    className: "text-[#047857] dark:text-[#34D399]",
  },
  "substack.com": {
    label: "Substack",
    className: "text-[#C2410C] dark:text-[#FB923C]",
  },
  "getmaxim.ai": {
    label: "Maxim AI",
    className: "text-[#0F766E] dark:text-[#2DD4BF]",
  },
};

const DEFAULT_CROSS_POST = {
  label: "Hashnode",
  className: "text-[#1D4ED8] dark:text-[#60A5FA]",
};

export function getCrossPost(url: string): {
  label: string;
  className: string;
} {
  try {
    const host = new URL(url).hostname.toLowerCase();
    for (const [domain, meta] of Object.entries(CROSS_POST_MAP)) {
      if (hostMatches(host, domain)) return meta;
    }
    if (isBifrostHost(host)) return CROSS_POST_MAP["getmaxim.ai"];
  } catch {
    // ignore malformed URLs
  }
  return DEFAULT_CROSS_POST;
}
