"use client";

import { i18n } from "@/lib/i18n";
import {
  SYNCED_SCROLL_DURATION,
  useSmartAutoplay,
} from "@/lib/use-smart-autoplay";
import Autoplay from "embla-carousel-autoplay";
import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useRef, useState } from "react";
import { ProjectCard } from "./project-card";
import { ProjectOverlay, type ProjectOverlayData } from "./project-overlay";

interface ProjectMeta {
  slug: string;
  cover?: string;
  title: string;
  description?: string;
  link?: string;
}

interface ProjectItem {
  meta: ProjectMeta;
  content: string;
}

const AUTOPLAY_DELAY_MS = 2500;

export function ProjectCarousel({ items }: { items: ProjectItem[] }) {
  const autoplayRef = useRef(
    Autoplay({
      delay: AUTOPLAY_DELAY_MS,
      stopOnInteraction: true,
      playOnInit: true,
    })
  );
  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      align: "start",
      duration: SYNCED_SCROLL_DURATION,
      dragFree: true,
    },
    [autoplayRef.current]
  );

  const { pause, resume } = useSmartAutoplay(emblaApi, autoplayRef.current);

  const [activeProject, setActiveProject] = useState<ProjectOverlayData | null>(
    null
  );

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (!emblaApi) return;

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        emblaApi.scrollPrev();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        emblaApi.scrollNext();
      }
    },
    [emblaApi]
  );

  // ponytail: embla loop:true handles infinite scrolling internally
  return (
    <>
      <div
        className="embla w-full"
        ref={emblaRef}
        onKeyDown={onKeyDown}
        onMouseEnter={pause}
        onMouseLeave={resume}
        onFocus={pause}
        onBlur={resume}
        tabIndex={0}
        role="region"
        aria-label={i18n.common.projectsCarousel}
        aria-roledescription="carousel"
      >
        <div className="embla__container flex">
          {items.map((item, i) => {
            const cardContent = (
              <ProjectCard
                item={item}
                imageWidth={480}
                imageHeight={270}
                sizes="320px"
              />
            );

            return (
              <div
                key={`${item.meta.slug}-${i}`}
                className="embla__slide mr-4 shrink-0"
                style={{ width: 320 }}
                onClick={() => setActiveProject(item)}
                role="group"
                aria-roledescription="slide"
                aria-label={`Slide ${i + 1} of ${items.length}: ${item.meta.title}`}
                tabIndex={-1}
              >
                {cardContent}
              </div>
            );
          })}
        </div>
      </div>

      <ProjectOverlay
        project={activeProject}
        onClose={() => setActiveProject(null)}
      />
    </>
  );
}
