"use client";

import Image from "next/image";
import { useState } from "react";
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
  const [activeProject, setActiveProject] = useState<ProjectOverlayData | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {items.map((item) => {
          return (
            <div
              key={item.meta.slug}
              onClick={() => setActiveProject(item)}
              className="cursor-pointer"
            >
              <div className="group block rounded-lg overflow-hidden border border-border hover:border-foreground/30 transition-colors h-full">
                {item.meta.cover ? (
                  <Image
                    src={item.meta.cover}
                    alt={item.meta.title}
                    width={400}
                    height={225}
                    className="object-cover w-full aspect-video"
                  />
                ) : (
                  <div className="w-full aspect-video bg-secondary flex items-center justify-center text-xs text-muted-foreground font-mono px-4 text-center">
                    {item.meta.title}
                  </div>
                )}
                <div className="p-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold">{item.meta.title}</p>
                  </div>
                  {item.meta.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
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
