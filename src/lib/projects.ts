import type { ProjectEntry } from "@/lib/content";
import { parseSection } from "@/lib/project-overlay-data";

/**
 * Flattens a project collection entry into what the card, index and overlay
 * all need. Features and the tech stack are lifted out of the markdown body's
 * "### Features" / "### Tech Stack" sections, which is where they have always
 * lived — see lib/project-overlay-data.ts.
 */
export interface ProjectView {
  slug: string;
  title: string;
  description?: string;
  /** Public-style path, e.g. "/project/anrl.jpg". Resolved via lib/images. */
  cover?: string;
  link?: string;
  features: string[];
  techStack: string[];
}

export function toProjectView(entry: ProjectEntry): ProjectView {
  const body = entry.body ?? "";
  return {
    slug: entry.id,
    title: entry.data.title,
    description: entry.data.description,
    cover: entry.data.cover,
    link: entry.data.link,
    features: parseSection(body, "Features"),
    techStack: parseSection(body, "Tech Stack"),
  };
}

/** Bold marker is authoring emphasis, not part of the feature text. */
export function cleanFeature(feature: string): string {
  return feature.replace(/\*\*/g, "");
}

/**
 * Tech-stack entries are written as "**Name** — why it is here". The tag only
 * shows the name: the bolded span when there is one, otherwise everything
 * before the first dash.
 */
export function techLabel(tech: string): string {
  const bold = tech.match(/\*\*(.+?)\*\*/);
  return bold ? bold[1] : tech.split("—")[0].split("–")[0].trim();
}
