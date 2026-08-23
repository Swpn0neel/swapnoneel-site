import { InformationPage } from "@/components/information-page";
import { developersPage } from "@/lib/public-page-content";
import { developerResources } from "@/lib/site-manifest";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Developer resources",
  description: developersPage.description,
  alternates: {
    canonical: "/developers",
    types: { "text/markdown": "/developers.md" },
  },
};

export default function DevelopersPage() {
  return (
    <>
      <InformationPage page={developersPage} />
      <section
        aria-labelledby="resource-links"
        className="mx-auto -mt-4 max-w-2xl pb-12"
      >
        <h2
          id="resource-links"
          className="mb-3 text-xl font-semibold tracking-tight"
        >
          Resource links
        </h2>
        <ul className="divide-border divide-y text-sm">
          {developerResources.map((resource) => (
            <li key={resource.key}>
              <a
                href={resource.href}
                className="text-body-foreground hover:text-foreground flex items-center justify-between gap-4 py-3 transition-colors"
              >
                <span>{resource.label}</span>
                <span aria-hidden="true">↗</span>
              </a>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
