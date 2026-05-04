import ProjectGrid from "@/components/project-grid";
import { i18n } from "@/lib/i18n";
import { getAllProjects, getAllWorkItems } from "@/lib/md";
import { Award, GitBranch, LineChart, Trophy, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "Work",
};

const achievements = [
  {
    text: i18n.work.achievements[0],
    icon: Trophy,
  },
  {
    text: i18n.work.achievements[1],
    icon: Award,
  },
  {
    text: i18n.work.achievements[2],
    icon: Award,
  },
  {
    text: i18n.work.achievements[3],
    icon: Trophy,
  },
  {
    text: i18n.work.achievements[4],
    icon: GitBranch,
  },
  {
    text: i18n.work.achievements[5],
    icon: Users,
  },
  {
    text: i18n.work.achievements[6],
    icon: LineChart,
  },
];

export default async function WorkPage() {
  const workItems = await getAllWorkItems();
  const projects = await getAllProjects();

  return (
    <div className="space-y-10 pb-16">
      {/* Experience */}
      <section>
        <h2 className="text-muted-foreground mb-5 text-sm font-semibold tracking-widest uppercase">
          {i18n.work.sections.experience}
        </h2>
        <div className="space-y-0">
          {workItems.map((item, i) => (
            <div key={item.meta.slug}>
              {item.meta.link ? (
                <a
                  href={item.meta.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 py-4"
                >
                  <ExperienceRow item={item} />
                </a>
              ) : (
                <Link
                  href={`/work/${item.meta.slug}`}
                  className="group flex items-center gap-3 py-4"
                >
                  <ExperienceRow item={item} />
                </Link>
              )}
              {i < workItems.length - 1 && <hr className="border-border" />}
            </div>
          ))}
          <div className="mt-2">
            <hr className="border-border" />
            <div className="flex justify-end py-6">
              <Link
                href="/work/others"
                className="text-muted-foreground hover:text-foreground group/more flex items-center gap-1 text-xs transition-colors"
              >
                <span className="group-hover/more:underline">
                  {i18n.common.viewMore}
                </span>
                <span className="text-[10px]">→</span>
              </Link>
            </div>
            <hr className="border-border" />
          </div>
        </div>
      </section>

      {/* Projects */}
      <section>
        <h2 className="text-muted-foreground mb-5 text-sm font-semibold tracking-widest uppercase">
          {i18n.work.sections.projects}
        </h2>
        <ProjectGrid items={projects} />
      </section>

      <hr className="border-border" />

      {/* Achievements */}
      <section>
        <h2 className="text-muted-foreground mb-5 text-sm font-semibold tracking-widest uppercase">
          {i18n.work.sections.achievements}
        </h2>
        <div className="space-y-4">
          {achievements.map((achievement, i) => (
            <div key={i} className="group flex items-center gap-4">
              <div className="bg-secondary/50 text-muted-foreground group-hover:text-primary rounded-md p-1.5 transition-colors">
                <achievement.icon size={16} />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-foreground/90 group-hover:text-foreground text-sm leading-relaxed transition-colors">
                  {achievement.text}
                </p>
              </div>
            </div>
          ))}
        </div>
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
          className="flex-shrink-0 rounded-md object-cover"
        />
      ) : (
        <div className="bg-secondary h-9 w-9 flex-shrink-0 rounded-md" />
      )}
      <div className="flex-1">
        <p className="text-sm font-medium group-hover:underline">
          {item.meta.title}
        </p>
        <p className="text-muted-foreground text-xs">{item.meta.date}</p>
      </div>
      <span className="text-muted-foreground group-hover:text-foreground flex items-center gap-1 text-xs transition-all">
        <span className="group-hover:underline">{i18n.common.readMore}</span>
        <span className="text-[10px] no-underline">→</span>
      </span>
    </>
  );
}
