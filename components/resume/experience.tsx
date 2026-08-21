import { i18n } from "@/lib/i18n";
import { getAllWorkItems } from "@/lib/md";
import { Briefcase } from "lucide-react";

export function ResumeExperience() {
  const workItems = getAllWorkItems();

  return (
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
            <div className="text-muted-foreground max-w-none space-y-2 text-xs leading-relaxed text-pretty lowercase">
              <p>{item.meta.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
