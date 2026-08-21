import type { ProjectCardData } from "@/lib/project-overlay-data";
import Link from "next/link";
import { ProjectCard } from "./project-card";

export function ProjectGrid({ items }: { items: ProjectCardData[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <Link
          key={item.meta.slug}
          href={`/projects/${item.meta.slug}`}
          scroll={false}
          className="block cursor-pointer text-left"
          aria-label={`Open details for ${item.meta.title}`}
        >
          <ProjectCard
            item={item}
            sizes="(max-width: 640px) calc(100vw - 2rem), 380px"
          />
        </Link>
      ))}
    </div>
  );
}
