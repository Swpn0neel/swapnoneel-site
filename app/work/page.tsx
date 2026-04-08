import Image from "next/image";
import Link from "next/link";
import { getAllWorkItems, getAllProjects } from "@/lib/md";
import ProjectGrid from "@/components/project-grid";

export const metadata = {
  title: "Work — Swapnoneel Saha",
};

export default function WorkPage() {
  const workItems = getAllWorkItems();
  const projects = getAllProjects();

  return (
    <div className="pb-16 space-y-10">
      {/* Experience */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-5">
          Experience
        </h2>
        <div className="space-y-0">
          {workItems.map((item, i) => (
            <div key={item.meta.slug}>
              {item.meta.link ? (
                <a
                  href={item.meta.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 py-4 group"
                >
                  <ExperienceRow item={item} />
                </a>
              ) : (
                <Link
                  href={`/work/${item.meta.slug}`}
                  className="flex items-center gap-3 py-4 group"
                >
                  <ExperienceRow item={item} />
                </Link>
              )}
              {i < workItems.length - 1 && <hr className="border-border" />}
            </div>
          ))}
        </div>
      </section>

      <hr className="border-border" />

      {/* Projects */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-5">
          Projects
        </h2>
        <ProjectGrid items={projects} />
      </section>
    </div>
  );
}

function ExperienceRow({
  item,
}: {
  item: { meta: { cover?: string; title: string; date: string } };
}) {
  return (
    <>
      {item.meta.cover ? (
        <Image
          src={item.meta.cover}
          alt={item.meta.title}
          width={36}
          height={36}
          className="rounded-md object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-9 h-9 rounded-md bg-secondary flex-shrink-0" />
      )}
      <div className="flex-1">
        <p className="text-sm font-medium group-hover:underline">
          {item.meta.title}
        </p>
        <p className="text-xs text-muted-foreground">{item.meta.date}</p>
      </div>
      <span className="text-xs text-muted-foreground">Read more</span>
    </>
  );
}
