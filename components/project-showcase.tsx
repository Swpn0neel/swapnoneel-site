"use client";

import type { ProjectOverlayData } from "@/lib/project-overlay-data";
import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import { ProjectCarousel } from "./project-carousel";
import { ProjectIndex } from "./project-index";

const ProjectOverlay = dynamic(
  () => import("./project-overlay").then((module) => module.ProjectOverlay),
  { ssr: false }
);

// Owns the two pieces of state the carousel and the index have to agree on:
// which slide is showing (so the matching index row can echo it) and which
// project the overlay has open. The overlay is a modal with a focus trap, a
// body scroll lock and fixed element ids, so exactly one instance may exist.
export function ProjectShowcase({ items }: { items: ProjectOverlayData[] }) {
  const [activeSlug, setActiveSlug] = useState(items[0]?.meta.slug);
  const [openProject, setOpenProject] = useState<ProjectOverlayData | null>(
    null
  );
  // SmartCarousel pauses on its own hover, but the index below is driven by
  // the slide position too — advancing while someone reads it moves the
  // highlight out from under them.
  const [pointerWithin, setPointerWithin] = useState(false);

  const handleActiveProjectChange = useCallback((slug: string) => {
    setActiveSlug(slug);
  }, []);

  const handleOpen = useCallback((project: ProjectOverlayData) => {
    setOpenProject(project);
  }, []);

  const handleClose = useCallback(() => setOpenProject(null), []);

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
        onOpen={handleOpen}
        openSlug={openProject?.meta.slug}
        paused={openProject !== null || pointerWithin}
      />
      <ProjectIndex
        items={items}
        activeSlug={activeSlug}
        onOpen={handleOpen}
        openSlug={openProject?.meta.slug}
      />
      <ProjectOverlay project={openProject} onClose={handleClose} />
    </div>
  );
}
