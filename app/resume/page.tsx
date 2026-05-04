import { StaggerContainer, StaggerItem } from "@/components/fade-in";
import { ResumeActions } from "@/components/resume-actions";
import { siteConfig, socialLinks } from "@/lib/config";
import { i18n } from "@/lib/i18n";
import { getAllProjects, getAllWorkItems } from "@/lib/md";
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
};

export default async function ResumePage() {
  const workItems = await getAllWorkItems();
  const allProjects = await getAllProjects();

  // Specific projects as requested (replacing in-poster with toile)
  const selectedSlugs = ["get-response", "toile", "term-ai", "scholarian"];
  const projects = allProjects
    .filter((p) => selectedSlugs.includes(p.meta.slug))
    .sort(
      (a, b) =>
        selectedSlugs.indexOf(a.meta.slug) - selectedSlugs.indexOf(b.meta.slug)
    );

  // Find social links for header
  const github = socialLinks.find((s) => s.brand === "github")?.url;
  const linkedin = socialLinks.find((s) => s.brand === "linkedin")?.url;

  const skills = {
    languages: [
      "TypeScript",
      "JavaScript",
      "Python",
      "GoLang",
      "Java",
      "SQL",
      "C/C++",
    ],
    frameworks: [
      "Next.js",
      "Django",
      "Node.js",
      "Flask",
      "Socket.io",
      "Prisma",
      "Tailwind CSS",
    ],
    tools: [
      "Docker",
      "MongoDB",
      "PostgreSQL",
      "Git",
      "RAG (AI)",
      "API Design",
      "UI/UX (Figma)",
    ],
  };

  const achievements = i18n.work.achievements;

  return (
    <div className="mx-auto max-w-3xl px-4 pt-4 pb-20 sm:px-0">
      <div className="mb-8 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center print:mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight uppercase sm:text-4xl print:text-3xl">
            {siteConfig.person.fullName}
          </h1>
          <p className="text-muted-foreground mt-2 text-lg font-medium lowercase print:text-base">
            {i18n.resume.jobTitle}
          </p>
        </div>
        <ResumeActions />
      </div>

      <StaggerContainer staggerDelay={0.1}>
        {/* Contact Info */}
        <StaggerItem>
          <div className="text-muted-foreground mb-8 flex flex-wrap gap-x-6 gap-y-2 text-sm print:mb-6 print:text-xs">
            <a
              href={`mailto:${siteConfig.person.email}`}
              className="hover:text-foreground flex items-center gap-2 transition-colors"
            >
              <Mail size={14} />
              {siteConfig.person.email}
            </a>
            {linkedin && (
              <a
                href={linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground flex items-center gap-2 transition-colors"
              >
                <LinkedinIcon size={14} />
                linkedin.com/in/swapnoneel
              </a>
            )}
            {github && (
              <a
                href={github}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground flex items-center gap-2 transition-colors"
              >
                <GithubIcon size={14} />
                github.com/Swpn0neel
              </a>
            )}
            <a
              href="https://swapnoneel.site"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground flex items-center gap-2 transition-colors"
            >
              <Globe size={14} />
              swapnoneel.site
            </a>
          </div>
        </StaggerItem>

        {/* Summary */}
        <StaggerItem>
          <section className="mb-10 print:mb-6">
            <h2 className="text-muted-foreground border-border mb-4 border-b pb-2 text-xs font-bold tracking-widest uppercase">
              {i18n.resume.summaryHeading}
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed lowercase">
              {i18n.resume.summaryContent}
            </p>
          </section>
        </StaggerItem>

        {/* Skills - Now Full Width */}
        <StaggerItem>
          <section className="mb-12 print:mb-8">
            <h2 className="text-muted-foreground border-border mb-6 flex items-center gap-2 border-b pb-2 text-xs font-bold tracking-widest uppercase">
              <Code2 size={14} />
              {i18n.resume.skillsHeading}
            </h2>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 print:gap-4">
              <div className="space-y-3">
                <h3 className="text-muted-foreground border-primary/30 border-l-2 pl-2 text-[10px] font-bold tracking-widest uppercase">
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
                <h3 className="text-muted-foreground border-primary/30 border-l-2 pl-2 text-[10px] font-bold tracking-widest uppercase">
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
                <h3 className="text-muted-foreground border-primary/30 border-l-2 pl-2 text-[10px] font-bold tracking-widest uppercase">
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
        </StaggerItem>

        <div className="grid grid-cols-1 gap-10 md:grid-cols-3 print:grid-cols-3 print:gap-6">
          {/* Main Column */}
          <div className="space-y-10 md:col-span-2 print:col-span-2 print:space-y-6">
            {/* Experience */}
            <section>
              <h2 className="text-muted-foreground border-border mb-6 flex items-center gap-2 border-b pb-2 text-xs font-bold tracking-widest uppercase">
                <Briefcase size={14} />
                {i18n.resume.experienceHeading}
              </h2>
              <div className="space-y-8 print:space-y-4">
                {workItems.map((item) => (
                  <div key={item.meta.slug} className="group">
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-sm font-semibold uppercase">
                        {item.meta.title}
                      </h3>
                      <span className="text-muted-foreground text-[10px] font-medium">
                        {item.meta.date}
                      </span>
                    </div>
                    <div className="text-muted-foreground prose prose-sm prose-invert prose-p:my-1 prose-li:my-0.5 max-w-none space-y-2 text-xs leading-relaxed lowercase">
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
              <h2 className="text-muted-foreground border-border mb-6 flex items-center gap-2 border-b pb-2 text-xs font-bold tracking-widest uppercase">
                <Code2 size={14} />
                {i18n.resume.projectsHeading}
              </h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 print:gap-4">
                {projects.map((project) => (
                  <div
                    key={project.meta.slug}
                    className="border-border bg-secondary/10 hover:bg-secondary/20 rounded-lg border p-4 transition-colors"
                  >
                    <h3 className="mb-1 flex items-center justify-between text-sm font-semibold uppercase">
                      {project.meta.title}
                      {project.meta.link && (
                        <a
                          href={project.meta.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </h3>
                    <p className="text-muted-foreground line-clamp-2 text-[11px] leading-relaxed lowercase">
                      {project.meta.description}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Side Column */}
          <div className="space-y-10 print:space-y-6">
            {/* Education */}
            <section>
              <h2 className="text-muted-foreground border-border mb-6 flex items-center gap-2 border-b pb-2 text-xs font-bold tracking-widest uppercase">
                <GraduationCap size={14} />
                {i18n.resume.educationHeading}
              </h2>
              <div className="space-y-6 print:space-y-4">
                {i18n.resume.education.map((edu, i) => (
                  <div key={i} className="space-y-1">
                    <h3 className="text-sm leading-tight font-semibold uppercase">
                      {edu.school}
                    </h3>
                    <p className="text-muted-foreground text-xs lowercase">
                      {edu.degree}
                    </p>
                    <p className="text-muted-foreground text-[11px] font-medium lowercase italic">
                      {edu.date} | {edu.result}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Achievements */}
            <section>
              <h2 className="text-muted-foreground border-border mb-6 flex items-center gap-2 border-b pb-2 text-xs font-bold tracking-widest uppercase">
                <Trophy size={14} />
                {i18n.resume.achievementsHeading}
              </h2>
              <div className="space-y-3 print:space-y-2">
                {achievements.slice(0, 5).map((achievement, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-muted-foreground mt-0.5 text-xs">
                      -
                    </span>
                    <p className="text-muted-foreground text-[12px] leading-relaxed lowercase">
                      {achievement}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </StaggerContainer>

      <footer className="border-border mt-20 border-t pt-8 text-center print:hidden">
        <Link
          href="/contact"
          className="bg-foreground text-background hover:bg-foreground/90 inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-medium transition-colors"
        >
          {i18n.resume.hireMe}
        </Link>
      </footer>
    </div>
  );
}
