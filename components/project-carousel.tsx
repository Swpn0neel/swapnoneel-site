"use client";

import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";
import { useRef, useState } from "react";
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
  const [emblaRef] = useEmblaCarousel({ loop: true, align: "start" }, [
    autoplayRef.current,
  ]);

  const [activeProject, setActiveProject] = useState<ProjectOverlayData | null>(null);

  // Triple the items for a seamless infinite scrolling feel (same approach as SocialLinks)
  const tripled = [...items, ...items, ...items];

  return (
    <>
      <div className="embla w-full overflow-hidden" ref={emblaRef}>
        <div className="embla__container flex">
          {tripled.map((item, i) => {
            const isExternal = !!item.meta.link;

            const cardContent = (
              <div className="group block rounded-lg overflow-hidden border border-border hover:border-foreground/30 transition-colors h-full cursor-pointer">
                {item.meta.cover ? (
                  <Image
                    src={item.meta.cover}
                    alt={item.meta.title}
                    width={400}
                    height={225}
                    className="object-cover w-full h-36"
                  />
                ) : (
                  <div className="w-full h-36 bg-secondary flex items-center justify-center text-xs text-muted-foreground font-mono px-4 text-center">
                    {item.meta.title}
                  </div>
                )}
                <div className="p-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold">{item.meta.title}</p>
                    {isExternal && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-muted-foreground"
                      >
                        <path d="M7 7h10v10" />
                        <path d="M7 17 17 7" />
                      </svg>
                    )}
                  </div>
                  {item.meta.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                      {item.meta.description}
                    </p>
                  )}
                </div>
              </div>
            );

            return (
              <div
                key={i}
                className="embla__slide shrink-0 mr-3"
                style={{ width: 220 }}
                onClick={() => setActiveProject(item)}
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
