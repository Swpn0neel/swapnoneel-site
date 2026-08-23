import { ResumeAchievements } from "@/components/resume/achievements";
import { ResumeEducation } from "@/components/resume/education";
import { ResumeExperience } from "@/components/resume/experience";
import { ResumeHeader } from "@/components/resume/header";
import { ResumeProjects } from "@/components/resume/projects";
import { ResumeSkills } from "@/components/resume/skills";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/config";
import { i18n } from "@/lib/i18n";
import Link from "next/link";

export const metadata = {
  title: i18n.resume.pageTitle,
  description: i18n.resume.summaryContent,
  alternates: { canonical: "/resume" },
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

export default function ResumePage() {
  return (
    <div className="mx-auto max-w-3xl min-w-0 pt-2 pb-16 sm:pt-4 sm:pb-20">
      <ResumeHeader />

      <section className="mb-9 sm:mb-10 print:mb-6">
        <h2 className="text-muted-foreground border-border mb-4 border-b pb-2 text-xs font-bold tracking-widest uppercase">
          {i18n.resume.summaryHeading}
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed lowercase">
          {i18n.resume.summaryContent}
        </p>
        <p className="text-muted-foreground mt-3 text-xs leading-relaxed">
          Looking for source-backed verification? Review the{" "}
          <Link href="/credentials" className="underline underline-offset-4">
            credentials and evidence index
          </Link>
          , including its explicit limitations.
        </p>
      </section>

      <ResumeSkills />

      <div className="grid min-w-0 grid-cols-1 gap-10 md:grid-cols-3 print:grid-cols-3 print:gap-6">
        <div className="space-y-10 md:col-span-2 print:col-span-2 print:space-y-6">
          <ResumeExperience />
          <ResumeProjects />
        </div>
        <div className="space-y-10 print:space-y-6">
          <ResumeEducation />
          <ResumeAchievements />
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
