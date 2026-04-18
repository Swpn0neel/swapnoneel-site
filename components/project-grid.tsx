"use client";

import { useState } from "react";
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

export default function ProjectGrid({ items }: { items: ProjectItem[] }) {
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
                  <OptimizedImage
                    src={item.meta.cover}
                    alt={item.meta.title}
                    width={400}
                    height={225}
                    className="aspect-video"
                  />
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
    </>
  );
}
