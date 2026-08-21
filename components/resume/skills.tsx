import { skills } from "@/lib/config";
import { i18n } from "@/lib/i18n";
import { Code2 } from "lucide-react";

export function ResumeSkills() {
  return (
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
  );
}
