"use client";

import type { ProjectCardData, ProjectMeta } from "@/lib/project-overlay-data";
import { useCallback, useState } from "react";
import { ProjectCarousel } from "./project-carousel";
import { ProjectIndex } from "./project-index";
import {
  LazyProjectOverlay,
  preloadProjectOverlay,
  useProjectOverlayPreload,
} from "./project-overlay-loader";

// Owns the two pieces of state the carousel and the index have to agree on:
// which slide is showing (so the matching index row can echo it) and which
// project the overlay has open. The overlay is a modal with a focus trap, a
// body scroll lock and fixed element ids, so exactly one instance may exist.
export function ProjectShowcase({ items }: { items: ProjectCardData[] }) {
  const [activeSlug, setActiveSlug] = useState(items[0]?.meta.slug);
  const [openProject, setOpenProject] = useState<ProjectMeta | null>(null);
  const sectionRef = useProjectOverlayPreload<HTMLDivElement>();
  // SmartCarousel pauses on its own hover, but the index below is driven by
  // the slide position too — advancing while someone reads it moves the
  // highlight out from under them.
  const [pointerWithin, setPointerWithin] = useState(false);

  const handleActiveProjectChange = useCallback((slug: string) => {
    setActiveSlug(slug);
  }, []);

  const handleOpen = useCallback((project: ProjectCardData) => {
    // A cold click still commits the open state immediately; the dynamic
    // component consumes this same promise, so pointerdown-to-click time is
    // useful download time and there is no artificial wait in the handler.
    void preloadProjectOverlay();
    setOpenProject(project.meta);
  }, []);

  const handleClose = useCallback(() => setOpenProject(null), []);

  return (
    <div
      ref={sectionRef}
      className="space-y-6"
      onPointerOverCapture={() => void preloadProjectOverlay()}
      onFocusCapture={() => void preloadProjectOverlay()}
      onPointerDownCapture={() => void preloadProjectOverlay()}
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
        onOpen={handleOpen}
        openSlug={openProject?.slug}
        paused={openProject !== null || pointerWithin}
      />
      <ProjectIndex
        items={items}
        activeSlug={activeSlug}
        onOpen={handleOpen}
        openSlug={openProject?.slug}
      />
      {openProject && (
        <LazyProjectOverlay project={openProject} onClose={handleClose} />
      )}
    </div>
  );
}
