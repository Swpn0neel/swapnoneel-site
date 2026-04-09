import Image from "next/image";
import Link from "next/link";
import { getAllWorkItems, getAllProjects } from "@/lib/md";
import ProjectGrid from "@/components/project-grid";
import { Trophy, Award, GitBranch, Users, LineChart } from "lucide-react";

export const metadata = {
  title: "Work — Swapnoneel Saha",
};

const achievements = [
  {
    text: "Winner of the Hack Around the World 2 Hackathon offered by MLH Hacks.",
    icon: Trophy,
  },
  {
    text: "Second Runner-Up of Hack 4 Bengal 3.0, Eastern India’s Largest Offline Hackathon.",
    icon: Award,
  },
  {
    text: "Second Runner-Up of the Treasure Hacks 3.0 Hackathon among 600 participants.",
    icon: Award,
  },
  {
    text: "Winner of MAKATHON, an intra-university hackathon under Smart India Hackathon ‘23.",
    icon: Trophy,
  },
  {
    text: "Contributed to multiple large Open-Source projects like MindsDB, Keploy & was a contributor at GSSOC ’23.",
    icon: GitBranch,
  },
  {
    text: "Organized multiple educational sessions for students at our University involving DSA, Development & Open-Source.",
    icon: Users,
  },
  {
    text: "Solved over 1100+ questions on LeetCode, and have an overall contest rating of 1650+.",
    icon: LineChart,
  },
];

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
          <div className="mt-2">
            <hr className="border-border" />
            <div className="flex justify-end py-6">
              <Link
                href="/work/others"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 group/more"
              >
                <span className="group-hover/more:underline">View More</span>
                <span className="text-[10px]">→</span>
              </Link>
            </div>
            <hr className="border-border" />
          </div>
        </div>

      </section>

      {/* Projects */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-5">
          Projects
        </h2>
        <ProjectGrid items={projects} />
      </section>

      <hr className="border-border" />

      {/* Achievements */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-5">
          Achievements
        </h2>
        <div className="space-y-4">
          {achievements.map((achievement, i) => (
            <div key={i} className="flex gap-4 group items-center">
              <div className="p-1.5 rounded-md bg-secondary/50 text-muted-foreground group-hover:text-primary transition-colors">
                <achievement.icon size={16} />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm leading-relaxed text-foreground/90 group-hover:text-foreground transition-colors">
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
      <span className="text-xs text-muted-foreground group-hover:text-foreground transition-all flex items-center gap-1">
        <span className="group-hover:underline">Read more</span>
        <span className="text-[10px] no-underline">→</span>
      </span>


    </>
  );
}
