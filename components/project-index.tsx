"use client";

import type { ProjectOverlayData } from "@/lib/project-overlay-data";
import { firstLink } from "@/lib/utils";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ProjectCover } from "./project-card";

const ProjectOverlay = dynamic(
  () => import("./project-overlay").then((module) => module.ProjectOverlay),
  { ssr: false }
);

const PREVIEW_WIDTH = 340;
const CURSOR_GAP = 24;

// Text-first project index for the home page — tight title / one-liner rows
// with a ↗ link to the live site. On pointer devices the framed cover floats
// in beside the cursor for the hovered row; the full visual card grid lives
// on /work instead, so the two pages read differently.
export function ProjectIndex({ items }: { items: ProjectOverlayData[] }) {
  const [activeProject, setActiveProject] = useState<ProjectOverlayData | null>(
    null
  );
  const [hovered, setHovered] = useState<ProjectOverlayData | null>(null);
  const [canHover, setCanHover] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // min-width keeps the preview off narrow-but-mouse-driven windows,
    // where 280px of floating cover would blanket the whole list.
    const query = window.matchMedia(
      "(hover: hover) and (pointer: fine) and (min-width: 768px)"
    );
    setCanHover(query.matches);
    const onChange = (event: MediaQueryListEvent) => setCanHover(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  // The preview follows the cursor via a direct style write — routing the
  // position through React state would re-render the list on every
  // mousemove.
  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    const node = previewRef.current;
    if (!node) return;
    // On the first mouseenter the preview hasn't rendered its cover yet, so
    // offsetHeight is just the border — fall back to the known 16:9 size.
    const measured = node.offsetHeight;
    const previewHeight =
      measured > 50 ? measured : PREVIEW_WIDTH * (9 / 16);
    const fitsRight =
      event.clientX + CURSOR_GAP + PREVIEW_WIDTH <= window.innerWidth - 8;
    const x = fitsRight
      ? event.clientX + CURSOR_GAP
      : event.clientX - CURSOR_GAP - PREVIEW_WIDTH;
    const y = Math.min(
      Math.max(event.clientY - previewHeight / 2, 8),
      window.innerHeight - previewHeight - 8
    );
    node.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  }, []);

  return (
    <>
      <div
        className="divide-border divide-y"
        onMouseMove={canHover ? handleMouseMove : undefined}
        onMouseLeave={() => setHovered(null)}
      >
        {items.map((item) => {
          const liveLink = firstLink(item.meta.link);
          return (
            <div
              key={item.meta.slug}
              onMouseEnter={(event) => {
                // Rows can gain hover without a mousemove (scrolling under a
                // still cursor) — reposition here so the preview never shows
                // at a stale spot.
                handleMouseMove(event);
                setHovered(item);
              }}
              className="group flex items-baseline gap-3 py-3 first:pt-0 last:pb-0 sm:gap-4"
            >
              <button
                type="button"
                onClick={() => setActiveProject(item)}
                onFocus={() => setHovered(null)}
                aria-haspopup="dialog"
                aria-controls="project-overlay-dialog"
                aria-expanded={activeProject?.meta.slug === item.meta.slug}
                className="flex min-w-0 flex-1 cursor-pointer items-baseline gap-3 text-left sm:gap-4"
              >
                <span className="sr-only">Open details for </span>
                <span className="text-foreground/90 group-hover:text-foreground w-28 shrink-0 text-sm font-semibold transition-colors sm:w-36">
                  {item.meta.title}
                </span>
                {item.meta.description && (
                  <span className="text-muted-foreground/80 group-hover:text-muted-foreground line-clamp-2 min-w-0 flex-1 text-xs leading-relaxed transition-colors sm:line-clamp-1">
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
                  className="text-muted-foreground/60 hover:text-foreground ml-auto shrink-0 self-center transition-colors"
                >
                  {/* Same tilted-arrow glyph as the overlay's live link */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
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

      {/* Floating cover preview — mounted only on hover-capable devices,
          positioned imperatively from handleMouseMove. Portaled to <body>:
          ancestors with content-visibility (.deferred-render on the home
          page) paint-contain their descendants, which would clip a
          position:fixed element rendered in place. */}
      {canHover &&
        createPortal(
          <div
            ref={previewRef}
            aria-hidden="true"
            className={`border-border pointer-events-none fixed top-0 left-0 z-50 overflow-hidden rounded-md border shadow-xl transition-opacity duration-200 ${
              hovered?.meta.cover ? "opacity-100" : "opacity-0"
            }`}
            style={{ width: PREVIEW_WIDTH }}
          >
            {hovered?.meta.cover && (
              <ProjectCover
                cover={hovered.meta.cover}
                sizes={`${PREVIEW_WIDTH}px`}
              />
            )}
          </div>,
          document.body
        )}

      <ProjectOverlay
        project={activeProject}
        onClose={() => setActiveProject(null)}
      />
    </>
  );
}
