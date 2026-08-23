import { siteConfig } from "./config.ts";

export const SITE_ORIGIN = "https://www.swapnoneel.site";

type ChangeFrequency =
  | "always"
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "never";

type SitePage = {
  key: string;
  path: `/${string}`;
  title: string;
  description: string;
  changeFrequency: ChangeFrequency;
  priority: number;
  markdown: boolean;
};

/**
 * Canonical inventory for every non-content page in the public sitemap.
 *
 * Add or remove static pages here first. The sitemap and agent page index are
 * derived from this list, and `MarkdownPageKey` makes TypeScript require a
 * Markdown handler for every entry marked `markdown: true`.
 */
export const sitePages = [
  {
    key: "home",
    path: "/",
    title: "Home",
    description:
      "Profile, recent experience, selected projects, and contact details.",
    changeFrequency: "weekly",
    priority: 1,
    markdown: true,
  },
  {
    key: "blog",
    path: "/blog",
    title: "Technical blog",
    description: "Technical articles, tutorials, and engineering notes.",
    changeFrequency: "weekly",
    priority: 0.9,
    markdown: true,
  },
  {
    key: "work",
    path: "/work",
    title: "Work and projects",
    description: "Professional experience, projects, and achievements.",
    changeFrequency: "weekly",
    priority: 0.9,
    markdown: true,
  },
  {
    key: "otherWork",
    path: "/work/others",
    title: "Other experience",
    description: "Additional freelance, design, writing, and technical work.",
    changeFrequency: "monthly",
    priority: 0.6,
    markdown: true,
  },
  {
    key: "contact",
    path: "/contact",
    title: "Contact",
    description: "Contact form, email address, and call scheduling.",
    changeFrequency: "monthly",
    priority: 0.5,
    markdown: true,
  },
  {
    key: "about",
    path: "/about",
    title: "About Swapnoneel Saha",
    description: "Background, areas of focus, and working style.",
    changeFrequency: "monthly",
    priority: 0.7,
    markdown: true,
  },
  {
    key: "privacy",
    path: "/privacy",
    title: "Privacy",
    description: "Privacy practices for browsing, messages, and scheduling.",
    changeFrequency: "yearly",
    priority: 0.4,
    markdown: true,
  },
  {
    key: "developers",
    path: "/developers",
    title: "Developer resources",
    description: "Machine-readable interfaces and integration status.",
    changeFrequency: "monthly",
    priority: 0.7,
    markdown: true,
  },
  {
    key: "credentials",
    path: "/credentials",
    title: "Credentials and verification",
    description: "Evidence sources, confidence labels, and source limitations.",
    changeFrequency: "monthly",
    priority: 0.8,
    markdown: true,
  },
  {
    key: "resume",
    path: "/resume",
    title: "Résumé",
    description:
      "Skills, experience, education, achievements, and selected projects.",
    changeFrequency: "monthly",
    priority: 0.6,
    markdown: true,
  },
  {
    key: "feed",
    path: "/feed.xml",
    title: "RSS feed",
    description: "Recent technical writing in RSS format.",
    changeFrequency: "weekly",
    priority: 0.3,
    markdown: false,
  },
] as const satisfies readonly SitePage[];

export type SitePageEntry = (typeof sitePages)[number];
export type SitePageKey = SitePageEntry["key"];
export type MarkdownPageEntry = Extract<SitePageEntry, { markdown: true }>;
export type MarkdownPageKey = MarkdownPageEntry["key"];

export const markdownSitePages = sitePages.filter(
  (page): page is MarkdownPageEntry => page.markdown
);

export const machineFiles = [
  {
    key: "agentInstructions",
    label: "Agent instructions",
    href: "/agent-instructions.md",
    description:
      "When to use the site, how to read it, and attribution guidance.",
  },
  {
    key: "llms",
    label: "Concise agent profile",
    href: "/llms.txt",
    description:
      "Curated profile, current content index, and public resources.",
  },
  {
    key: "llmsFull",
    label: "Full content corpus",
    href: "/llms-full.txt",
    description: "Complete work, project, trust, and blog content.",
  },
  {
    key: "sitemap",
    label: "Sitemap",
    href: "/sitemap.xml",
    description: "Canonical inventory of public pages.",
  },
  {
    key: "robots",
    label: "Robots policy",
    href: "/robots.txt",
    description: "Crawler access policy and sitemap location.",
  },
] as const;

const credentialsPage = sitePages.find((page) => page.key === "credentials")!;
const feedPage = sitePages.find((page) => page.key === "feed")!;

export const developerResources = [
  {
    key: credentialsPage.key,
    label: credentialsPage.title,
    href: credentialsPage.path,
    description: credentialsPage.description,
  },
  ...machineFiles,
  {
    key: feedPage.key,
    label: feedPage.title,
    href: feedPage.path,
    description: feedPage.description,
  },
  {
    key: "source",
    label: "Source repository",
    href: siteConfig.repository.sourceUrl,
    description: "Source code for swapnoneel.site.",
  },
] as const;

export type DeveloperResourceKey = (typeof developerResources)[number]["key"];

export function absoluteSiteUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${SITE_ORIGIN}${path}`;
}

export function getDeveloperResource(key: DeveloperResourceKey) {
  return developerResources.find((resource) => resource.key === key)!;
}

export function getSitePage(key: SitePageKey) {
  return sitePages.find((page) => page.key === key)!;
}
