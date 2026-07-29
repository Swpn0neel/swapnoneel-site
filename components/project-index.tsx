"use client";

import type { ProjectOverlayData } from "@/lib/project-overlay-data";
import { firstLink } from "@/lib/utils";

// Text-first project index for the home page — tight title / one-liner rows
// with a ↗ link to the live site. The carousel above carries the project
// imagery, while this list stays focused on scanning and opening details.
export function ProjectIndex({
  items,
  activeSlug,
  onOpen,
  openSlug,
}: {
  items: ProjectOverlayData[];
  /** Slug of the slide the carousel above is showing, echoed on that row. */
  activeSlug?: string;
  onOpen: (project: ProjectOverlayData) => void;
  /** Slug of the project the shared overlay currently has open, if any. */
  openSlug?: string;
}) {
  return (
    <div className="divide-border divide-y">
      {items.map((item) => {
        const liveLink = firstLink(item.meta.link);
        const active = item.meta.slug === activeSlug;
        return (
          <div
            key={item.meta.slug}
            className="group grid grid-cols-1 grid-rows-1 py-3 first:pt-0 last:pb-0 sm:flex sm:items-baseline sm:gap-4"
          >
            <button
              type="button"
              onClick={() => onOpen(item)}
              aria-haspopup="dialog"
              aria-controls="project-overlay-dialog"
              aria-expanded={openSlug === item.meta.slug}
              aria-current={active ? "true" : undefined}
              className="col-start-1 row-start-1 flex min-w-0 flex-1 cursor-pointer flex-col gap-1 text-left sm:flex-row sm:items-baseline sm:gap-4"
            >
              <span className="sr-only">Open details for </span>
              <span
                className={`group-hover:text-foreground shrink-0 pr-6 text-sm transition-colors group-hover:underline sm:w-36 sm:pr-0 ${
                  active
                    ? "text-foreground font-semibold underline decoration-1 underline-offset-4"
                    : "text-foreground/80 font-medium"
                }`}
              >
                {item.meta.title}
              </span>
              {item.meta.description && (
                <span
                  className={`group-hover:text-foreground/80 line-clamp-2 min-w-0 flex-1 text-xs transition-colors sm:line-clamp-1 ${
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
                className={`hover:text-foreground group-hover:text-foreground col-start-1 row-start-1 flex h-5 shrink-0 items-center justify-self-end self-start text-xs transition-colors sm:ml-auto sm:h-auto sm:self-center ${
                  active ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {/* Same tilted-arrow glyph as the overlay's live link */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="1em"
                  height="1em"
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
  );
}
