"use client";

import type { ProjectOverlayData } from "@/lib/project-overlay-data";
import { useCallback, useState } from "react";
import { ProjectCarousel } from "./project-carousel";
import { ProjectIndex } from "./project-index";

export function ProjectShowcase({ items }: { items: ProjectOverlayData[] }) {
  const [activeSlug, setActiveSlug] = useState(items[0]?.meta.slug);

  const handleActiveProjectChange = useCallback((slug: string) => {
    setActiveSlug(slug);
  }, []);

  return (
    <div className="space-y-6">
      <ProjectCarousel
        items={items}
        onActiveProjectChange={handleActiveProjectChange}
      />
      <ProjectIndex items={items} activeSlug={activeSlug} />
    </div>
  );
}
