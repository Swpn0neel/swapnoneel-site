import { siteConfig } from "@/lib/config";
import { i18n } from "@/lib/i18n";
import { getCollection } from "astro:content";

/**
 * Every Open Graph card the site advertises, in one place.
 *
 * Pages read their key from here and the /og endpoint builds from the same
 * list, so a page cannot advertise a card that was never generated — which is
 * exactly what the query-string approach allowed: `/api/og?title=…` would
 * happily 404 or render something nobody checked.
 *
 * Blog posts are absent on purpose: they advertise their own cover image, which
 * is a real photograph rather than a generated card.
 */

export type OgCard =
  | { key: "index"; variant: "home" }
  | { key: string; variant: "page"; title: string; description: string };

export const WORK_DESCRIPTION =
  "Professional experience, projects, and achievements of Swapnoneel Saha — Software Engineer specializing in Agentic AI and full-stack development.";

/** Keys for the fixed routes, so pages can reference them without a string literal. */
export const OG_KEYS = {
  home: "index",
  work: "work",
  blog: "blog",
  contact: "contact",
  resume: "resume",
  /** Work and project detail pages share the /work/<slug> namespace. */
  detail: (slug: string) => `work-${slug}`,
} as const;

export async function listOgCards(): Promise<OgCard[]> {
  const [work, projects] = await Promise.all([
    getCollection("work"),
    getCollection("projects"),
  ]);

  const seen = new Set<string>();
  const details: OgCard[] = [];
  for (const entry of [...work, ...projects]) {
    if (seen.has(entry.id)) continue;
    seen.add(entry.id);
    details.push({
      key: OG_KEYS.detail(entry.id),
      variant: "page",
      title: entry.data.title,
      description: entry.data.description,
    });
  }

  return [
    { key: OG_KEYS.home, variant: "home" },
    {
      key: OG_KEYS.work,
      variant: "page",
      title: "Work",
      description: WORK_DESCRIPTION,
    },
    {
      key: OG_KEYS.blog,
      variant: "page",
      title: i18n.blog.title,
      description: i18n.blog.description,
    },
    {
      key: OG_KEYS.contact,
      variant: "page",
      title: i18n.contactPage.title,
      description: i18n.contactPage.intro,
    },
    {
      key: OG_KEYS.resume,
      variant: "page",
      title: siteConfig.person.fullName,
      description: i18n.resume.summaryContent,
    },
    ...details,
  ];
}
