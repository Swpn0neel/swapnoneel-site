import { ResumeActions } from "@/components/resume-actions";
import { SocialIcon } from "@/components/social-links";
import { siteConfig, socialLinks } from "@/lib/config";
import { i18n } from "@/lib/i18n";
import { Globe, Mail } from "lucide-react";

const githubUrl = socialLinks.find((s) => s.brand === "github")?.url;
const linkedinUrl = socialLinks.find((s) => s.brand === "linkedin")?.url;

export function ResumeHeader() {
  return (
    <>
      <div className="mb-4 flex flex-col items-start justify-between gap-4 sm:mb-8 sm:flex-row sm:items-center sm:gap-6 print:mb-6">
        <div className="min-w-0">
          <h1 className="text-[clamp(1.45rem,8.2vw,2.25rem)] leading-[1.05] font-bold tracking-[0.015em] text-balance uppercase print:text-3xl">
            {siteConfig.person.fullName}
          </h1>
          <p className="text-muted-foreground mt-2 text-sm leading-snug font-medium text-pretty sm:text-lg print:text-base">
            {i18n.resume.jobTitle}
          </p>
        </div>
        <ResumeActions />
      </div>

      <div className="text-muted-foreground mb-5 grid min-w-0 grid-cols-1 gap-0 text-xs leading-4 min-[540px]:mb-8 min-[540px]:flex min-[540px]:flex-wrap min-[540px]:gap-x-6 min-[540px]:gap-y-2 min-[540px]:text-sm min-[540px]:leading-5 print:mb-6 print:flex print:flex-wrap print:gap-x-6 print:gap-y-2 print:text-xs print:leading-normal">
        <a
          href={`mailto:${siteConfig.person.email}`}
          className="hover:text-foreground -mx-2 flex min-h-9 min-w-0 items-center gap-1.5 rounded px-2 transition-colors min-[540px]:mx-0 min-[540px]:min-h-0 min-[540px]:gap-2 min-[540px]:px-0 print:mx-0 print:min-h-0 print:px-0"
        >
          <Mail size={14} className="shrink-0" aria-hidden="true" />
          <span className="wrap-anywhere">{siteConfig.person.email}</span>
        </a>
        {linkedinUrl && (
          <a
            href={linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground -mx-2 flex min-h-9 min-w-0 items-center gap-1.5 rounded px-2 transition-colors min-[540px]:mx-0 min-[540px]:min-h-0 min-[540px]:gap-2 min-[540px]:px-0 print:mx-0 print:min-h-0 print:px-0"
          >
            <SocialIcon brand="linkedin" className="h-3.5 w-3.5 shrink-0" />
            <span className="wrap-anywhere">linkedin.com/in/swapnoneel</span>
          </a>
        )}
        {githubUrl && (
          <a
            href={githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground -mx-2 flex min-h-9 min-w-0 items-center gap-1.5 rounded px-2 transition-colors min-[540px]:mx-0 min-[540px]:min-h-0 min-[540px]:gap-2 min-[540px]:px-0 print:mx-0 print:min-h-0 print:px-0"
          >
            <SocialIcon brand="github" className="h-3.5 w-3.5 shrink-0" />
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
    </>
  );
}
