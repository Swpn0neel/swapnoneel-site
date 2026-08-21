import { i18n } from "@/lib/i18n";
import { GraduationCap } from "lucide-react";

export function ResumeEducation() {
  return (
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
  );
}
