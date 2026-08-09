import { ResumeActions } from "@/components/resume-actions";
import { Button } from "@/components/ui/button";
import { siteConfig, skills, socialLinks } from "@/lib/config";
import { i18n } from "@/lib/i18n";
import { getAllProjects, getAllWorkItems } from "@/lib/md";
import { firstLink } from "@/lib/utils";
import {
  Briefcase,
  Code2,
  ExternalLink,
  Globe,
  GraduationCap,
  Mail,
  Trophy,
} from "lucide-react";
import Link from "next/link";

function GithubIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.28 1.15-.28 2.35 0 3.5-.73 1.02-1.08 2.25-1 3.5 0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

function LinkedinIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

export const metadata = {
  title: i18n.resume.pageTitle,
  description: i18n.resume.summaryContent,
  alternates: {
    canonical: "/resume",
  },
  openGraph: {
    title: `${i18n.resume.pageTitle} | ${siteConfig.person.fullName}`,
    description: i18n.resume.summaryContent,
    url: "https://www.swapnoneel.site/resume",
    type: "profile",
  },
  twitter: {
    card: "summary_large_image",
    title: `${i18n.resume.pageTitle} | ${siteConfig.person.fullName}`,
    description: i18n.resume.summaryContent,
  },
};

const socialLinksMap = Object.fromEntries(
  socialLinks.map((s) => [s.brand, s.url])
);

export default function ResumePage() {
  const workItems = getAllWorkItems();
  const allProjects = getAllProjects();

  // Specific projects as requested (scholarian, mesh-hop, term-chat, folio)
  const selectedSlugs = ["scholarian", "mesh-hop", "term-chat", "folio"];
  const projects = allProjects
    .filter((p) => selectedSlugs.includes(p.meta.slug))
    .sort(
      (a, b) =>
        selectedSlugs.indexOf(a.meta.slug) - selectedSlugs.indexOf(b.meta.slug)
    );

  // Find social links for header
  const github = socialLinksMap["github"];
  const linkedin = socialLinksMap["linkedin"];

  const achievements = i18n.work.achievements;

  return (
    <div className="mx-auto max-w-3xl min-w-0 pt-2 pb-16 sm:pt-4 sm:pb-20">
      <div className="mb-4 flex flex-col items-start justify-between gap-4 sm:mb-8 sm:flex-row sm:items-center sm:gap-6 print:mb-6">
        <div className="min-w-0">
          {/* Positive tracking, not negative. Capitals are drawn on a wider
              sidebearing than lowercase and crowd each other at default
              spacing; this was at -0.03em, which tightened them further. Large
              display caps need only a little, hence 0.015em rather than the
              0.05–0.1em the small uppercase labels below carry. */}
          <h1 className="text-[clamp(1.45rem,8.2vw,2.25rem)] leading-[1.05] font-bold tracking-[0.015em] text-balance uppercase print:text-3xl">
            {siteConfig.person.fullName}
          </h1>
          <p className="text-muted-foreground mt-2 text-sm leading-snug font-medium text-pretty sm:text-lg print:text-base">
            {i18n.resume.jobTitle}
          </p>
        </div>
        <ResumeActions />
      </div>

      {/* Contact Info */}
      <div className="text-muted-foreground mb-5 grid min-w-0 grid-cols-1 gap-0 text-xs leading-4 min-[540px]:mb-8 min-[540px]:flex min-[540px]:flex-wrap min-[540px]:gap-x-6 min-[540px]:gap-y-2 min-[540px]:text-sm min-[540px]:leading-5 print:mb-6 print:flex print:flex-wrap print:gap-x-6 print:gap-y-2 print:text-xs print:leading-normal">
        <a
          href={`mailto:${siteConfig.person.email}`}
          className="hover:text-foreground -mx-2 flex min-h-9 min-w-0 items-center gap-1.5 rounded px-2 transition-colors min-[540px]:mx-0 min-[540px]:min-h-0 min-[540px]:gap-2 min-[540px]:px-0 print:mx-0 print:min-h-0 print:px-0"
        >
          <Mail size={14} className="shrink-0" aria-hidden="true" />
          <span className="wrap-anywhere">{siteConfig.person.email}</span>
        </a>
        {linkedin && (
          <a
            href={linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground -mx-2 flex min-h-9 min-w-0 items-center gap-1.5 rounded px-2 transition-colors min-[540px]:mx-0 min-[540px]:min-h-0 min-[540px]:gap-2 min-[540px]:px-0 print:mx-0 print:min-h-0 print:px-0"
          >
            <span className="shrink-0" aria-hidden="true">
              <LinkedinIcon size={14} />
            </span>
            <span className="wrap-anywhere">linkedin.com/in/swapnoneel</span>
          </a>
        )}
        {github && (
          <a
            href={github}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground -mx-2 flex min-h-9 min-w-0 items-center gap-1.5 rounded px-2 transition-colors min-[540px]:mx-0 min-[540px]:min-h-0 min-[540px]:gap-2 min-[540px]:px-0 print:mx-0 print:min-h-0 print:px-0"
          >
            <span className="shrink-0" aria-hidden="true">
              <GithubIcon size={14} />
            </span>
            <span className="wrap-anywhere">github.com/Swpn0neel</span>
          </a>
        )}
        <a
          href="https://swapnoneel.site"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-foreground -mx-2 flex min-h-9 min-w-0 items-center gap-1.5 rounded px-2 transition-colors min-[540px]:mx-0 min-[540px]:min-h-0 min-[540px]:gap-2 min-[540px]:px-0 print:mx-0 print:min-h-0 print:px-0"
        >
          <Globe size={14} className="shrink-0" aria-hidden="true" />
          <span className="wrap-anywhere">swapnoneel.site</span>
        </a>
      </div>

      {/* Summary */}
      <section className="mb-9 sm:mb-10 print:mb-6">
        <h2 className="text-muted-foreground border-border mb-4 border-b pb-2 text-xs font-bold tracking-widest uppercase">
          {i18n.resume.summaryHeading}
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed lowercase">
          {i18n.resume.summaryContent}
        </p>
      </section>

      {/* Skills - Now Full Width */}
      <section className="mb-10 sm:mb-12 print:mb-8">
        <h2 className="text-muted-foreground border-border mb-5 flex items-center gap-2 border-b pb-2 text-xs font-bold tracking-widest uppercase sm:mb-6">
          <Code2 size={14} />
          {i18n.resume.skillsHeading}
        </h2>
        <div className="grid grid-cols-1 gap-6 min-[560px]:grid-cols-3 min-[560px]:gap-5 print:gap-4">
          <div className="space-y-3">
            <h3 className="text-muted-foreground border-border text-2xs border-b border-dashed pb-1 font-bold tracking-widest uppercase">
              {i18n.resume.skillsCategories.languages}
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {skills.languages.map((skill) => (
                <span
                  key={skill}
                  className="bg-secondary/40 text-foreground rounded px-2 py-0.5 text-xs lowercase"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <h3 className="text-muted-foreground border-border text-2xs border-b border-dashed pb-1 font-bold tracking-widest uppercase">
              {i18n.resume.skillsCategories.frameworks}
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {skills.frameworks.map((skill) => (
                <span
                  key={skill}
                  className="bg-secondary/40 text-foreground rounded px-2 py-0.5 text-xs lowercase"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <h3 className="text-muted-foreground border-border text-2xs border-b border-dashed pb-1 font-bold tracking-widest uppercase">
              {i18n.resume.skillsCategories.tools}
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {skills.tools.map((skill) => (
                <span
                  key={skill}
                  className="bg-secondary/40 text-foreground rounded px-2 py-0.5 text-xs lowercase"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="grid min-w-0 grid-cols-1 gap-10 md:grid-cols-3 print:grid-cols-3 print:gap-6">
        {/* Main Column */}
        <div className="space-y-10 md:col-span-2 print:col-span-2 print:space-y-6">
          {/* Experience */}
          <section>
            <h2 className="text-muted-foreground border-border mb-5 flex items-center gap-2 border-b pb-2 text-xs font-bold tracking-widest uppercase sm:mb-6">
              <Briefcase size={14} />
              {i18n.resume.experienceHeading}
            </h2>
            <div className="space-y-8 print:space-y-4">
              {workItems.map((item) => (
                <div key={item.meta.slug} className="group min-w-0">
                  <div className="mb-2 flex min-w-0 flex-col items-start gap-1 min-[480px]:flex-row min-[480px]:items-baseline min-[480px]:justify-between min-[480px]:gap-4">
                    <h3 className="min-w-0 text-sm leading-snug font-semibold tracking-wider text-balance uppercase">
                      {item.meta.title}
                    </h3>
                    <span className="text-muted-foreground text-2xs shrink-0 font-medium whitespace-nowrap">
                      {item.meta.date}
                    </span>
                  </div>
                  {/* Not `.prose`. Of the five prose-* classes that used to
                        sit here only `.prose` did anything — the Tailwind
                        typography plugin isn't installed, so prose-sm,
                        prose-invert and the prose-p:/prose-li: variants were
                        inert. `.prose` is the site's own article-body rule and
                        it is unlayered, so it outranked the `text-xs` beside
                        it and silently rendered this blurb at article body
                        size and colour instead. */}
                  <div className="text-muted-foreground max-w-none space-y-2 text-xs leading-relaxed text-pretty lowercase">
                    {/* We'll render a simplified version of the content here or just the description */}
                    <p>{item.meta.description}</p>
                    {/* For the resume, it's better to provide a few bullet points. 
                          Since we are generating this, we can distill the content. */}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Projects */}
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
                    className={`group border-border bg-secondary/10 hover:bg-secondary/20 block min-w-0 rounded-md border p-4 transition-colors ${
                      project.meta.link ? "cursor-pointer" : ""
                    }`}
                  >
                    <h3 className="mb-1 flex min-w-0 items-start justify-between gap-3 text-sm leading-snug font-semibold tracking-wider uppercase">
                      <span className="min-w-0 wrap-anywhere">
                        {project.meta.title}
                      </span>
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
        </div>

        {/* Side Column */}
        <div className="space-y-10 print:space-y-6">
          {/* Education */}
          <section>
            <h2 className="text-muted-foreground border-border mb-5 flex items-center gap-2 border-b pb-2 text-xs font-bold tracking-widest uppercase sm:mb-6">
              <GraduationCap size={14} />
              {i18n.resume.educationHeading}
            </h2>
            <div className="space-y-6 print:space-y-4">
              {i18n.resume.education.map((edu, i) => (
                <div key={i} className="space-y-1">
                  <h3 className="text-sm leading-tight font-semibold tracking-wider uppercase">
                    {edu.school}
                  </h3>
                  <p className="text-muted-foreground text-xs leading-relaxed lowercase">
                    {edu.degree}
                  </p>
                  <p className="text-muted-foreground text-2xs leading-relaxed font-medium lowercase italic">
                    {edu.date} | {edu.result}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Achievements */}
          <section>
            <h2 className="text-muted-foreground border-border mb-5 flex items-center gap-2 border-b pb-2 text-xs font-bold tracking-widest uppercase sm:mb-6">
              <Trophy size={14} />
              {i18n.resume.achievementsHeading}
            </h2>
            <div className="space-y-3 print:space-y-2">
              {achievements.slice(0, 5).map((achievement, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-muted-foreground mt-0.5 text-xs">
                    -
                  </span>
                  <p className="text-muted-foreground text-xs leading-relaxed text-pretty lowercase">
                    {achievement}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      <footer className="border-border mt-16 border-t pt-8 text-center sm:mt-20 print:hidden">
        <Link href="/contact" className="block min-[420px]:inline-block">
          <Button
            variant="primary"
            size="lg"
            className="h-11 w-full rounded-md min-[420px]:w-auto"
          >
            {i18n.resume.hireMe}
          </Button>
        </Link>
      </footer>
    </div>
  );
}
