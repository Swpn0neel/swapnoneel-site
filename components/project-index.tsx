"use client";

import type { ProjectCardData } from "@/lib/project-overlay-data";
import { firstLink } from "@/lib/utils";
import Link from "next/link";

// Text-first project index for the home page — tight title / one-liner rows
// with a ↗ link to the live site. The carousel above carries the project
// imagery, while this list stays focused on scanning and opening details.
export function ProjectIndex({
  items,
  activeSlug,
}: {
  items: ProjectCardData[];
  /** Slug of the slide the carousel above is showing, echoed on that row. */
  activeSlug?: string;
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
            <Link
              href={`/projects/${item.meta.slug}`}
              scroll={false}
              aria-current={active ? "true" : undefined}
              aria-label={`Open details for ${item.meta.title}`}
              className="col-start-1 row-start-1 flex min-w-0 flex-1 cursor-pointer flex-col gap-1 text-left sm:flex-row sm:items-baseline sm:gap-4"
            >
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
            </Link>
            {liveLink && (
              <a
                href={liveLink}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Visit ${item.meta.title}`}
                // size-6 is the WCAG 2.5.8 floor, not a visual choice: the
                // glyph is 1em of text-xs, so the link measured 14.4x24px and
                // failed target-size. The box grows around the same 1em glyph
                // rather than scaling it, and the button's mobile pr-6 already
                // reserves exactly this much room.
                className={`hover:text-foreground group-hover:text-foreground col-start-1 row-start-1 flex size-6 shrink-0 items-center justify-center self-start justify-self-end text-xs transition-colors sm:ml-auto sm:self-center ${
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
