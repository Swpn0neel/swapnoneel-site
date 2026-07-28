"use client";

import type { ProjectOverlayData } from "@/lib/project-overlay-data";
import { firstLink } from "@/lib/utils";
import dynamic from "next/dynamic";
import { useState } from "react";

const ProjectOverlay = dynamic(
  () => import("./project-overlay").then((module) => module.ProjectOverlay),
  { ssr: false }
);

// Text-first project index for the home page — tight title / one-liner rows
// with a ↗ link to the live site. The carousel above carries the project
// imagery, while this list stays focused on scanning and opening details.
export function ProjectIndex({
  items,
  activeSlug,
}: {
  items: ProjectOverlayData[];
  activeSlug?: string;
}) {
  const [activeProject, setActiveProject] = useState<ProjectOverlayData | null>(
    null
  );

  return (
    <>
      <div className="divide-border divide-y">
        {items.map((item) => {
          const liveLink = firstLink(item.meta.link);
          const active = item.meta.slug === activeSlug;
          return (
            <div
              key={item.meta.slug}
              data-active={active ? "true" : "false"}
              className="group flex items-baseline gap-3 py-3 first:pt-0 last:pb-0 sm:gap-4"
            >
              <button
                type="button"
                onClick={() => setActiveProject(item)}
                aria-haspopup="dialog"
                aria-controls="project-overlay-dialog"
                aria-expanded={activeProject?.meta.slug === item.meta.slug}
                aria-current={active ? "true" : undefined}
                className="flex min-w-0 flex-1 cursor-pointer items-baseline gap-3 text-left sm:gap-4"
              >
                <span className="sr-only">Open details for </span>
                <span
                  className={`w-28 shrink-0 text-sm group-hover:underline sm:w-36 ${
                    active
                      ? "text-foreground font-semibold underline decoration-1 underline-offset-4"
                      : "text-foreground/80 font-medium"
                  }`}
                >
                  {item.meta.title}
                </span>
                {item.meta.description && (
                  <span
                    className={`hidden min-w-0 flex-1 text-xs sm:line-clamp-1 ${
                      active ? "text-foreground/80" : "text-muted-foreground"
                    }`}
                  >
                    {item.meta.description}
                  </span>
                )}
              </button>
              {liveLink && (
                <a
                  href={liveLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Visit ${item.meta.title}`}
                  className={`hover:text-foreground ml-auto shrink-0 self-center transition-colors ${
                    active ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {/* Same tilted-arrow glyph as the overlay's live link */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M7 7h10v10" />
                    <path d="M7 17 17 7" />
                  </svg>
                </a>
              )}
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
