import type { PublicPageContent } from "@/lib/public-page-content";

export function InformationPage({ page }: { page: PublicPageContent }) {
  return (
    <article className="mx-auto max-w-2xl space-y-8 pb-12">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">{page.title}</h1>
        <p className="text-body-foreground text-sm leading-relaxed">
          {page.intro}
        </p>
      </header>

      {page.sections.map((section) => (
        <section key={section.heading} className="space-y-3">
          <h2 className="text-xl font-semibold tracking-tight">
            {section.heading}
          </h2>
          {section.paragraphs.map((paragraph) => (
            <p
              key={paragraph}
              className="text-body-foreground text-sm leading-relaxed"
            >
              {paragraph}
            </p>
          ))}
        </section>
      ))}
    </article>
  );
}
