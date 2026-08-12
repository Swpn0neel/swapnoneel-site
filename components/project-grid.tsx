"use client";

import type {
  ProjectCardData,
  ProjectMeta,
} from "@/lib/project-overlay-data";
import { useState } from "react";
import { ProjectCard } from "./project-card";
import {
  LazyProjectOverlay,
  preloadProjectOverlay,
  useProjectOverlayPreload,
} from "./project-overlay-loader";

export function ProjectGrid({ items }: { items: ProjectCardData[] }) {
  const [activeProject, setActiveProject] = useState<ProjectMeta | null>(null);
  const sectionRef = useProjectOverlayPreload<HTMLDivElement>();

  return (
    <>
      <div
        ref={sectionRef}
        className="grid grid-cols-1 gap-3 sm:grid-cols-2"
        onPointerOverCapture={() => void preloadProjectOverlay()}
        onFocusCapture={() => void preloadProjectOverlay()}
        onPointerDownCapture={() => void preloadProjectOverlay()}
      >
        {items.map((item) => (
          <button
            type="button"
            key={item.meta.slug}
            onClick={() => {
              void preloadProjectOverlay();
              setActiveProject(item.meta);
            }}
            aria-haspopup="dialog"
            aria-controls="project-overlay-dialog"
            aria-expanded={activeProject?.slug === item.meta.slug}
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

      {activeProject && (
        <LazyProjectOverlay
          project={activeProject}
          onClose={() => setActiveProject(null)}
        />
      )}
    </>
  );
}
