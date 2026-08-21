import { resumeProjectSlugs } from "@/lib/config";
import { i18n } from "@/lib/i18n";
import { getAllProjects } from "@/lib/md";
import { firstLink } from "@/lib/utils";
import { Code2, ExternalLink } from "lucide-react";

export function ResumeProjects() {
  // Ordered by the list, not by date — see resumeProjectSlugs.
  const bySlug = new Map(getAllProjects().map((p) => [p.meta.slug, p]));
  const projects = resumeProjectSlugs
    .map((slug) => bySlug.get(slug))
    .filter((p) => p !== undefined);

  return (
    <section>
      <h2 className="text-muted-foreground border-border mb-5 flex items-center gap-2 border-b pb-2 text-xs font-bold tracking-widest uppercase sm:mb-6">
        <Code2 size={14} />
        {i18n.resume.projectsHeading}
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 print:gap-4">
        {projects.map((project) => {
          const CardComponent = project.meta.link ? "a" : "div";
          return (
            <CardComponent
              key={project.meta.slug}
              href={firstLink(project.meta.link) || undefined}
              target={project.meta.link ? "_blank" : undefined}
              rel={project.meta.link ? "noopener noreferrer" : undefined}
              className={`group border-border bg-secondary/10 hover:bg-secondary/20 block min-w-0 rounded-md border p-4 transition-colors ${project.meta.link ? "cursor-pointer" : ""}`}
            >
              <h3 className="mb-1 flex min-w-0 items-start justify-between gap-3 text-sm leading-snug font-semibold tracking-wider uppercase">
                <span className="min-w-0 wrap-anywhere">{project.meta.title}</span>
                {project.meta.link && (
                  <span className="text-muted-foreground group-hover:text-foreground mt-0.5 shrink-0 transition-colors">
                    <ExternalLink size={12} />
                  </span>
                )}
              </h3>
              <p className="text-muted-foreground line-clamp-3 text-xs leading-relaxed text-pretty lowercase sm:line-clamp-2">
                {project.meta.description}
              </p>
            </CardComponent>
          );
        })}
      </div>
    </section>
  );
}
