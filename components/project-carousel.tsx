"use client";

import { i18n } from "@/lib/i18n";
import type { ProjectOverlayData } from "@/lib/project-overlay-data";
import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import { ProjectCover } from "./project-card";
import { SmartCarousel } from "./smart-carousel";

const ProjectOverlay = dynamic(
  () => import("./project-overlay").then((module) => module.ProjectOverlay),
  { ssr: false }
);

interface ProjectCarouselProps {
  items: ProjectOverlayData[];
  onActiveProjectChange?: (slug: string) => void;
}

export function ProjectCarousel({
  items,
  onActiveProjectChange,
}: ProjectCarouselProps) {
  const [activeProject, setActiveProject] = useState<ProjectOverlayData | null>(
    null
  );
  const [activeIndex, setActiveIndex] = useState(0);

  const handleSlideChange = useCallback(
    (index: number) => {
      setActiveIndex(index);
      const item = items[index];
      if (item) onActiveProjectChange?.(item.meta.slug);
    },
    [items, onActiveProjectChange]
  );

  return (
    <>
      <div className="w-full">
        <SmartCarousel
          ariaLabel={i18n.common.projectsCarousel}
          className="w-full"
          align="center"
          dragFree={false}
          autoplayDelay={4500}
          onSlideChange={handleSlideChange}
        >
          <ul className="smart-carousel__container flex">
            {items.map((item, i) => {
              const active = i === activeIndex;
              return (
                <li
                  key={`${item.meta.slug}-${i}`}
                  className="smart-carousel__slide mr-4 w-[82%] shrink-0 sm:w-[76%]"
                  aria-label={`Slide ${i + 1} of ${items.length}: ${item.meta.title}`}
                  aria-current={active ? "true" : undefined}
                >
                  <button
                    type="button"
                    onClick={() => setActiveProject(item)}
                    aria-haspopup="dialog"
                    aria-controls="project-overlay-dialog"
                    aria-expanded={activeProject?.meta.slug === item.meta.slug}
                    className="group border-border block h-full w-full overflow-hidden rounded-md border"
                  >
                    <span className="sr-only">Open details for </span>
                    {item.meta.cover ? (
                      <ProjectCover
                        cover={item.meta.cover}
                        sizes="(min-width: 640px) 580px, 82vw"
                        priority={i === 0}
                      />
                    ) : (
                      <span className="bg-secondary text-muted-foreground flex aspect-video w-full items-center justify-center px-4 text-center font-mono text-xs">
                        {item.meta.title}
                      </span>
                    )}
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
