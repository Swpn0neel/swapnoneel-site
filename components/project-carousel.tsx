"use client";

import { i18n } from "@/lib/i18n";
import Autoplay from "embla-carousel-autoplay";
import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useRef, useState } from "react";
import { OptimizedImage } from "./optimized-image";
import ProjectOverlay, { type ProjectOverlayData } from "./project-overlay";

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

export default function ProjectCarousel({ items }: { items: ProjectItem[] }) {
  const autoplayRef = useRef(
    Autoplay({ delay: AUTOPLAY_DELAY_MS, stopOnInteraction: false })
  );
  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      align: "start",
      duration: 30, // Smoother transition
      dragFree: true, // Less "snappy", more fluid
    },
    [autoplayRef.current]
  );

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

  const tripled = [...items, ...items, ...items];

  return (
    <>
      <div
        className="embla w-full overflow-hidden"
        ref={emblaRef}
        onKeyDown={onKeyDown}
        tabIndex={0}
        role="region"
        aria-label={i18n.common.projectsCarousel}
        aria-roledescription="carousel"
      >
        <div className="embla__container flex">
          {tripled.map((item, i) => {
            const cardContent = (
              <div className="group border-border hover:border-foreground/30 block h-full cursor-pointer overflow-hidden rounded-lg border transition-colors">
                {item.meta.cover ? (
                  <OptimizedImage
                    src={item.meta.cover}
                    alt={item.meta.title}
                    width={480}
                    height={270}
                    className="h-44"
                  />
                ) : (
                  <div className="bg-secondary text-muted-foreground flex h-44 w-full items-center justify-center px-4 text-center font-mono text-xs">
                    {item.meta.title}
                  </div>
                )}
                <div className="p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{item.meta.title}</p>
                  </div>
                  {item.meta.description && (
                    <p className="text-muted-foreground mt-1 line-clamp-2 text-xs leading-relaxed">
                      {item.meta.description}
                    </p>
                  )}
                </div>
              </div>
            );

            return (
              <div
                key={`${item.meta.slug}-${i}`}
                className="embla__slide mr-4 shrink-0"
                style={{ width: 280 }}
                onClick={() => setActiveProject(item)}
                role="group"
                aria-roledescription="slide"
                aria-label={`Slide ${(i % items.length) + 1} of ${items.length}: ${item.meta.title}`}
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
