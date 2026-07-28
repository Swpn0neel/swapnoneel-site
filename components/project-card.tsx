import { SmoothImage } from "@/components/smooth-image";
import blurMap from "@/lib/blur-map.json";
import paletteMap from "@/lib/palette-map.json";
import type { CSSProperties } from "react";

interface ProjectMeta {
  slug: string;
  cover?: string;
  title: string;
  description?: string;
  link?: string | string[];
}

interface ProjectCardProps {
  item: { meta: ProjectMeta };
  sizes: string;
  priority?: boolean;
}

const palettes = paletteMap as Record<string, { h1: number; h2: number }>;

// The framed-screenshot visual on its own: gradient derived from the
// screenshot's dominant hues with a CSS-rendered browser window on top
// (see .project-cover / .project-window in globals.css). Reused by the
// hover preview in ProjectIndex.
export function ProjectCover({
  cover,
  sizes,
  priority = false,
}: {
  cover: string;
  sizes: string;
  priority?: boolean;
}) {
  const palette = palettes[cover];

  return (
    <div
      className="project-cover relative aspect-video w-full overflow-hidden"
      style={
        {
          "--pc-h1": String(palette?.h1 ?? 220),
          "--pc-h2": String(palette?.h2 ?? 200),
        } as CSSProperties
      }
    >
      <div className="project-window">
        <div className="flex h-[18px] flex-none items-center bg-[#1b1b1f] px-2">
          <span aria-hidden="true" className="flex items-center gap-1">
            <span className="h-[5px] w-[5px] shrink-0 rounded-full bg-white/20" />
            <span className="h-[5px] w-[5px] shrink-0 rounded-full bg-white/20" />
            <span className="h-[5px] w-[5px] shrink-0 rounded-full bg-white/20" />
          </span>
        </div>
        <div className="project-window-shot">
          <div>
            <SmoothImage
              src={cover}
              alt=""
              fill
              className="object-cover object-top"
              sizes={sizes}
              priority={priority}
              showSkeleton
              blurDataURL={(blurMap as Record<string, string>)[cover]}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Shared visual card used by both ProjectCarousel and ProjectGrid — the
// interactive wrapper (slide vs. grid cell, click handling) stays with the
// caller.
export function ProjectCard({ item, sizes, priority = false }: ProjectCardProps) {
  return (
    <div className="group border-border block h-full cursor-pointer overflow-hidden rounded-md border transition-colors">
      {item.meta.cover ? (
        <ProjectCover
          cover={item.meta.cover}
          sizes={sizes}
          priority={priority}
        />
      ) : (
        <div className="bg-secondary text-muted-foreground flex aspect-video w-full items-center justify-center px-4 text-center font-mono text-xs">
          {item.meta.title}
        </div>
      )}
      <div className="p-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">{item.meta.title}</p>
        </div>
        {item.meta.description && (
          <p className="text-muted-foreground mt-1 line-clamp-2 text-xs leading-relaxed">
            {item.meta.description}
          </p>
        )}
      </div>
    </div>
  );
}
