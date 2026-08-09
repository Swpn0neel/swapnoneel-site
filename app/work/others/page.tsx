import { WorkBackLink } from "@/components/work-back-link";
import { i18n } from "@/lib/i18n";

export const metadata = {
  title: i18n.work.otherExperience.title,
};

export default function OthersPage() {
  return (
    <article className="pb-16">
      <div className="mb-8">
        <WorkBackLink />
        <h1 className="mt-4 mb-1 text-xl font-semibold">
          {i18n.work.otherExperience.role}
        </h1>
        <p className="text-muted-foreground text-xs">
          {i18n.work.otherExperience.date}
        </p>
        <p className="mt-2 text-sm font-medium">
          {i18n.work.otherExperience.subtitle}
        </p>
      </div>

      <div className="prose prose-sm max-w-none">
        <p>{i18n.work.otherExperience.intro}</p>
        <ul>
          <li>
            <strong>{i18n.work.otherExperience.bulletTitles.growth}</strong>{" "}
            {i18n.work.otherExperience.bullets.growth}
          </li>
          <li>
            <strong>{i18n.work.otherExperience.bulletTitles.design}</strong>{" "}
            {i18n.work.otherExperience.bullets.design}
          </li>
          <li>
            <strong>{i18n.work.otherExperience.bulletTitles.python}</strong>{" "}
            {i18n.work.otherExperience.bullets.python}
          </li>
          <li>
            <strong>{i18n.work.otherExperience.bulletTitles.web}</strong>{" "}
            {i18n.work.otherExperience.bullets.web}
          </li>
          <li>
            <strong>{i18n.work.otherExperience.bulletTitles.content}</strong>{" "}
            {i18n.work.otherExperience.bullets.content}
          </li>
        </ul>
      </div>
    </article>
  );
}
