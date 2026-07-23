import { SmoothImage } from "@/components/smooth-image";
import blurMap from "@/lib/blur-map.json";

interface ProjectMeta {
  slug: string;
  cover?: string;
  title: string;
  description?: string;
  link?: string | string[];
}

interface ProjectCardProps {
  item: { meta: ProjectMeta };
  imageWidth: number;
  imageHeight: number;
  sizes: string;
  priority?: boolean;
}

// Shared visual card used by both ProjectCarousel and ProjectGrid — the
// interactive wrapper (slide vs. grid cell, click handling) stays with the caller.
export function ProjectCard({
  item,
  imageWidth,
  imageHeight,
  sizes,
  priority = false,
}: ProjectCardProps) {
  return (
    <div className="group border-border hover:border-foreground/30 block h-full cursor-pointer overflow-hidden rounded-md border transition-colors">
      {item.meta.cover ? (
        <div className="relative aspect-video w-full overflow-hidden">
          <SmoothImage
            src={item.meta.cover}
            alt={item.meta.title}
            width={imageWidth}
            height={imageHeight}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
            sizes={sizes}
            priority={priority}
            showSkeleton
            blurDataURL={(blurMap as Record<string, string>)[item.meta.cover]}
          />
        </div>
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
