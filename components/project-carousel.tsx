"use client";

import Autoplay from "embla-carousel-autoplay";
import useEmblaCarousel from "embla-carousel-react";
import Image from "next/image";
import { useCallback, useRef, useState } from "react";
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

export default function ProjectCarousel({ items }: { items: ProjectItem[] }) {
  const autoplayRef = useRef(
    Autoplay({ delay: 2500, stopOnInteraction: false })
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
        aria-label="Projects carousel"
        aria-roledescription="carousel"
      >
        <div className="embla__container flex">
          {tripled.map((item, i) => {
            const cardContent = (
              <div className="group border-border hover:border-foreground/30 block h-full cursor-pointer overflow-hidden rounded-lg border transition-colors">
                {item.meta.cover ? (
                  <Image
                    src={item.meta.cover}
                    alt={item.meta.title}
                    width={400}
                    height={225}
                    className="h-36 w-full object-cover"
                  />
                ) : (
                  <div className="bg-secondary text-muted-foreground flex h-36 w-full items-center justify-center px-4 text-center font-mono text-xs">
                    {item.meta.title}
                  </div>
                )}
                <div className="p-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold">{item.meta.title}</p>
                  </div>
                  {item.meta.description && (
                    <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs leading-relaxed">
                      {item.meta.description}
                    </p>
                  )}
                </div>
              </div>
            );

            return (
              <div
                key={i}
                className="embla__slide mr-3 shrink-0"
                style={{ width: 220 }}
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
