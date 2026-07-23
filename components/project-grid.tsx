"use client";

import { useState } from "react";
import { ProjectCard } from "./project-card";
import { ProjectOverlay, type ProjectOverlayData } from "./project-overlay";

interface ProjectMeta {
  slug: string;
  cover?: string;
  title: string;
  description?: string;
  link?: string | string[];
}

interface ProjectItem {
  meta: ProjectMeta;
  content: string;
}

export function ProjectGrid({ items }: { items: ProjectItem[] }) {
  const [activeProject, setActiveProject] = useState<ProjectOverlayData | null>(
    null
  );

  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <div
            key={item.meta.slug}
            onClick={() => setActiveProject(item)}
            className="cursor-pointer"
          >
            <ProjectCard
              item={item}
              imageWidth={400}
              imageHeight={225}
              sizes="(max-width: 640px) calc(100vw - 2rem), 380px"
            />
          </div>
        ))}
      </div>

      <ProjectOverlay
        project={activeProject}
        onClose={() => setActiveProject(null)}
      />
    </>
  );
}
