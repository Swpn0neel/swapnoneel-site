export interface ProjectMeta {
  slug: string;
  cover?: string;
  title: string;
  description?: string;
  link?: string | string[];
}

export interface ProjectCardData {
  meta: ProjectMeta;
}

export interface ProjectOverlayContent {
  features: string[];
  techStack: string[];
}

export function toProjectCardData(project: {
  meta: ProjectMeta;
}): ProjectCardData {
  return {
    meta: {
      slug: project.meta.slug,
      cover: project.meta.cover,
      title: project.meta.title,
      description: project.meta.description,
      link: project.meta.link,
    },
  };
}
