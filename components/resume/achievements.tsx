import { i18n } from "@/lib/i18n";
import { Trophy } from "lucide-react";

const achievements =
  (i18n.resume as unknown as { achievements?: string[] }).achievements ??
  i18n.work.achievements;

export function ResumeAchievements() {
  return (
    <section>
      <h2 className="text-muted-foreground border-border mb-5 flex items-center gap-2 border-b pb-2 text-xs font-bold tracking-widest uppercase sm:mb-6">
        <Trophy size={14} />
        {i18n.resume.achievementsHeading}
      </h2>
      <div className="space-y-3 print:space-y-2">
        {achievements.slice(0, 5).map((achievement, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="text-muted-foreground mt-0.5 text-xs">-</span>
            <p className="text-muted-foreground text-xs leading-relaxed text-pretty lowercase">
              {achievement}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
