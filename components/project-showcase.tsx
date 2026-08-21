"use client";

import type { ProjectCardData } from "@/lib/project-overlay-data";
import { useCallback, useState } from "react";
import { ProjectCarousel } from "./project-carousel";
import { ProjectIndex } from "./project-index";

// Owns the active slide state the carousel and the index have to agree on.
export function ProjectShowcase({ items }: { items: ProjectCardData[] }) {
  const [activeSlug, setActiveSlug] = useState(items[0]?.meta.slug);
  // SmartCarousel pauses on its own hover, but the index below is driven by
  // the slide position too — advancing while someone reads it moves the
  // highlight out from under them.
  const [pointerWithin, setPointerWithin] = useState(false);

  const handleActiveProjectChange = useCallback((slug: string) => {
    setActiveSlug(slug);
  }, []);

  return (
    <div
      className="space-y-6"
      onPointerEnter={(event) => {
        if (event.pointerType === "touch") return;
        setPointerWithin(true);
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === "touch") return;
        setPointerWithin(false);
      }}
    >
      <ProjectCarousel
        items={items}
        onActiveProjectChange={handleActiveProjectChange}
        paused={pointerWithin}
      />
      <ProjectIndex items={items} activeSlug={activeSlug} />
    </div>
  );
}
