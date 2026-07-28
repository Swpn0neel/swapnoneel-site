"use client";

import { i18n } from "@/lib/i18n";
import type { ProjectOverlayData } from "@/lib/project-overlay-data";
import { useCallback, useState } from "react";
import { ProjectCover } from "./project-card";
import { SmartCarousel } from "./smart-carousel";

interface ProjectCarouselProps {
  items: ProjectOverlayData[];
  onOpen: (project: ProjectOverlayData) => void;
  /** Slug of the project the shared overlay currently has open, if any. */
  openSlug?: string;
  onActiveProjectChange?: (slug: string) => void;
  /** Holds autoplay — see SmartCarousel's `paused`. */
  paused?: boolean;
}

export function ProjectCarousel({
  items,
  onOpen,
  openSlug,
  onActiveProjectChange,
  paused = false,
}: ProjectCarouselProps) {
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
    <div className="w-full">
      <SmartCarousel
        ariaLabel={i18n.common.projectsCarousel}
        // Slide width lives in a variable because globals.css derives the
        // fallback's centring offset from it — see .smart-carousel__slide.
        className="w-full [--carousel-slide-width:82%] sm:[--carousel-slide-width:76%]"
        align="center"
        dragFree={false}
        autoplayDelay={4500}
        onSlideChange={handleSlideChange}
        paused={paused}
      >
        <ul className="smart-carousel__container flex">
          {items.map((item, i) => {
            const active = i === activeIndex;
            return (
              <li
                key={`${item.meta.slug}-${i}`}
                className="smart-carousel__slide mr-4 w-[var(--carousel-slide-width)] shrink-0"
                aria-label={`Slide ${i + 1} of ${items.length}: ${item.meta.title}`}
                aria-current={active ? "true" : undefined}
              >
                <button
                  type="button"
                  onClick={() => onOpen(item)}
                  aria-haspopup="dialog"
                  aria-controls="project-overlay-dialog"
                  aria-expanded={openSlug === item.meta.slug}
                  className="group border-border block h-full w-full overflow-hidden rounded-md border"
                >
                  {/* The cover renders with an empty alt, so the button has
                      no other text to name it. */}
                  <span className="sr-only">
                    Open details for {item.meta.title}
                  </span>
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
  );
}
