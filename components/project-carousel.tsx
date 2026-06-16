"use client";

import { SmoothImage } from "@/components/smooth-image";
import blurMap from "@/lib/blur-map.json";
import { i18n } from "@/lib/i18n";
import Autoplay from "embla-carousel-autoplay";
import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useRef, useState } from "react";
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
    Autoplay({ delay: AUTOPLAY_DELAY_MS, stopOnInteraction: false, playOnInit: true })
  );
  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      align: "start",
      duration: 30,
      dragFree: true,
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

  // ponytail: embla loop:true handles infinite scrolling internally
  return (
    <>
      <div
        className="embla w-full overflow-hidden"
        ref={emblaRef}
        onKeyDown={onKeyDown}
        onMouseEnter={() => autoplayRef.current?.stop()}
        onMouseLeave={() => autoplayRef.current?.play()}
        onFocus={() => autoplayRef.current?.stop()}
        onBlur={() => autoplayRef.current?.play()}
        tabIndex={0}
        role="region"
        aria-label={i18n.common.projectsCarousel}
        aria-roledescription="carousel"
      >
        <div className="embla__container flex">
          {items.map((item, i) => {
            const cardContent = (
              <div className="group border-border hover:border-foreground/30 block h-full cursor-pointer overflow-hidden rounded-lg border transition-colors">
                {item.meta.cover ? (
                  <div className="relative aspect-video w-full overflow-hidden">
                    <SmoothImage
                      src={item.meta.cover}
                      alt={item.meta.title}
                      width={480}
                      height={270}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                      priority={i === 0}
                      sizes="320px"
                      showSkeleton
                      blurDataURL={
                        (blurMap as Record<string, string>)[item.meta.cover]
                      }
                    />
                  </div>
                ) : (
                  <div className="bg-secondary text-muted-foreground flex aspect-video w-full items-center justify-center px-4 text-center font-mono text-xs">
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
