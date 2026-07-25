export interface ProjectMeta {
  slug: string;
  cover?: string;
  title: string;
  description?: string;
  link?: string | string[];
}

export interface ProjectOverlayData {
  meta: ProjectMeta;
  features: string[];
  techStack: string[];
}

function parseSection(content: string, heading: string): string[] {
  const regex = new RegExp(
    `###\\s+${heading}[\\s\\S]*?\\n([\\s\\S]*?)(?=###|$)`,
    "i"
  );
  const match = content.match(regex);
  if (!match) return [];

  return match[1]
    .split("\n")
    .filter((line) => line.trim().startsWith("-"))
    .map((line) => line.replace(/^-\s*/, "").trim())
    .filter(Boolean);
}

export function buildProjectOverlayData(project: {
  meta: ProjectMeta;
  content: string;
}): ProjectOverlayData {
  return {
    meta: project.meta,
    features: parseSection(project.content, "Features"),
    techStack: parseSection(project.content, "Tech Stack"),
  };
}
