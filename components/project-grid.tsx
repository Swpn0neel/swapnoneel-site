"use client";

import { ImagePreloader } from "@/components/image-preloader";
import { SmoothImage } from "@/components/smooth-image";
import blurMap from "@/lib/blur-map.json";
import { useState } from "react";
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

export function ProjectGrid({ items }: { items: ProjectItem[] }) {
  const [activeProject, setActiveProject] = useState<ProjectOverlayData | null>(
    null
  );

  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {items.map((item) => {
          return (
            <div
              key={item.meta.slug}
              onClick={() => setActiveProject(item)}
              className="cursor-pointer"
            >
              <div className="group border-border hover:border-foreground/30 block h-full overflow-hidden rounded-lg border transition-colors">
                {item.meta.cover ? (
                  <div className="relative aspect-video w-full overflow-hidden">
                    <SmoothImage
                      src={item.meta.cover}
                      alt={item.meta.title}
                      width={400}
                      height={225}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                      sizes="(max-width: 640px) 100vw, 50vw"
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
            </div>
          );
        })}
      </div>

      <ProjectOverlay
        project={activeProject}
        onClose={() => setActiveProject(null)}
      />

      <ImagePreloader
        images={items.map((item) => ({ src: item.meta.cover ?? "" }))}
      />
    </>
  );
}
