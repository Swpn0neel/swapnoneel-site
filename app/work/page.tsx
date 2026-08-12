import { ExperienceSection } from "@/components/experience-section";
import { ProjectGrid } from "@/components/project-grid";
import { i18n } from "@/lib/i18n";
import { getAllProjects, getAllWorkItems } from "@/lib/md";
import { WORK_DESCRIPTION } from "@/lib/page-metadata";
import { toProjectCardData } from "@/lib/project-overlay-data";
import { firstLink, safeJsonLd } from "@/lib/utils";
import { Award, GitBranch, LineChart, Trophy, Users } from "lucide-react";

export const metadata = {
  title: "Work",
  description: WORK_DESCRIPTION,
  alternates: {
    canonical: "/work",
  },
  openGraph: {
    title: "Work",
    description: WORK_DESCRIPTION,
    url: "https://www.swapnoneel.site/work",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Work",
    description: WORK_DESCRIPTION,
  },
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

export default function WorkPage() {
  const workItems = getAllWorkItems();
  const projects = getAllProjects();
  const projectCards = projects.map(toProjectCardData);

  return (
    <div className="space-y-10 pb-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd({
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "Experience",
            itemListElement: workItems.map((item, index) => ({
              "@type": "ListItem",
              position: index + 1,
              url:
                firstLink(item.meta.link) ||
                `https://www.swapnoneel.site/work/${item.meta.slug}`,
              name: item.meta.title,
            })),
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd({
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "Projects",
            itemListElement: projects.map((project, index) => ({
              "@type": "ListItem",
              position: index + 1,
              url: `https://www.swapnoneel.site/work/${project.meta.slug}`,
              name: project.meta.title,
            })),
          }),
        }}
      />
      {/* Experience */}
      <ExperienceSection items={workItems} variant="prominent" />

      {/* Projects */}
      <section>
        <h2 className="text-muted-foreground mb-5 text-sm font-semibold tracking-widest uppercase">
          {i18n.work.sections.projects}
        </h2>
        <ProjectGrid items={projectCards} />
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
