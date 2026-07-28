"use client";

import type { ProjectOverlayData } from "@/lib/project-overlay-data";
import dynamic from "next/dynamic";
import { useState } from "react";
import { ProjectCard } from "./project-card";

const ProjectOverlay = dynamic(
  () => import("./project-overlay").then((module) => module.ProjectOverlay),
  { ssr: false }
);

export function ProjectGrid({ items }: { items: ProjectOverlayData[] }) {
  const [activeProject, setActiveProject] = useState<ProjectOverlayData | null>(
    null
  );

  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <button
            type="button"
            key={item.meta.slug}
            onClick={() => setActiveProject(item)}
            aria-haspopup="dialog"
            aria-controls="project-overlay-dialog"
            aria-expanded={activeProject?.meta.slug === item.meta.slug}
            className="block cursor-pointer text-left"
          >
            <span className="sr-only">Open details for </span>
            <ProjectCard
              item={item}
              sizes="(max-width: 640px) calc(100vw - 2rem), 380px"
            />
          </button>
        ))}
      </div>

      <ProjectOverlay
        project={activeProject}
        onClose={() => setActiveProject(null)}
      />
    </>
  );
}
