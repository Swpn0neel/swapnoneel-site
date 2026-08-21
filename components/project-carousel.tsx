"use client";

import { i18n } from "@/lib/i18n";
import type { ProjectCardData } from "@/lib/project-overlay-data";
import Link from "next/link";
import { useCallback, useState } from "react";
import { ProjectCover } from "./project-card";
import { SmartCarousel } from "./smart-carousel";

interface ProjectCarouselProps {
  items: ProjectCardData[];
  onActiveProjectChange?: (slug: string) => void;
  /** Holds autoplay — see SmartCarousel's `paused`. */
  paused?: boolean;
}

export function ProjectCarousel({
  items,
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
        // Two beats of SmartCarousel's shared clock: the projects strip steps
        // together with every second step of the socials strip.
        autoplayDelay={5000}
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
                <Link
                  href={`/projects/${item.meta.slug}`}
                  scroll={false}
                  className="group border-border block h-full w-full overflow-hidden rounded-md border"
                  aria-label={`Open details for ${item.meta.title}`}
                >
                  {item.meta.cover ? (
                    <ProjectCover
                      cover={item.meta.cover}
                      sizes="(min-width: 640px) 580px, 82vw"
                    />
                  ) : (
                    <span className="bg-secondary text-muted-foreground flex aspect-video w-full items-center justify-center px-4 text-center font-mono text-xs">
                      {item.meta.title}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </SmartCarousel>
    </div>
  );
}
