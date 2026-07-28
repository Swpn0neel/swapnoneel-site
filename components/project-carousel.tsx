"use client";

import { i18n } from "@/lib/i18n";
import type { ProjectOverlayData } from "@/lib/project-overlay-data";
import dynamic from "next/dynamic";
import { useState } from "react";
import { ProjectCard } from "./project-card";
import { SmartCarousel } from "./smart-carousel";

const ProjectOverlay = dynamic(
  () => import("./project-overlay").then((module) => module.ProjectOverlay),
  { ssr: false }
);

export function ProjectCarousel({ items }: { items: ProjectOverlayData[] }) {
  const [activeProject, setActiveProject] = useState<ProjectOverlayData | null>(
    null
  );

  return (
    <>
      <div className="w-full">
        <SmartCarousel
          ariaLabel={i18n.common.projectsCarousel}
          className="w-full"
        >
          <ul className="smart-carousel__container flex">
            {items.map((item, i) => {
              return (
                <li
                  key={`${item.meta.slug}-${i}`}
                  className="smart-carousel__slide mr-4 shrink-0"
                  style={{ width: 350 }}
                  aria-label={`Slide ${i + 1} of ${items.length}: ${item.meta.title}`}
                >
                  <button
                    type="button"
                    onClick={() => setActiveProject(item)}
                    aria-haspopup="dialog"
                    aria-controls="project-overlay-dialog"
                    aria-expanded={activeProject?.meta.slug === item.meta.slug}
                    className="block h-full w-full text-left"
                  >
                    <span className="sr-only">Open details for </span>
                    <ProjectCard item={item} sizes="350px" />
                  </button>
                </li>
              );
            })}
          </ul>
        </SmartCarousel>
      </div>

      <ProjectOverlay
        project={activeProject}
        onClose={() => setActiveProject(null)}
      />
    </>
  );
}
