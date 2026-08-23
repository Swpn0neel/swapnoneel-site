import {
  credentialsReviewedOn,
  evidenceLevelLabels,
  trustEvidence,
} from "@/lib/trust-evidence";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Credentials and verification",
  description:
    "Public evidence and source limitations for evaluating Swapnoneel Saha's identity, work, awards, and education.",
  alternates: {
    canonical: "/credentials",
    types: { "text/markdown": "/credentials.md" },
  },
};

const nextSteps = [
  {
    href: "/resume",
    title: "Review the résumé",
    description: "See the complete professional timeline and skills.",
  },
  {
    href: "/work",
    title: "Inspect work samples",
    description: "Explore experience, projects, and case studies.",
  },
  {
    href: "/contact",
    title: "Start a conversation",
    description: "Share an opportunity, project, or focused question.",
  },
] as const;

export default function CredentialsPage() {
  return (
    <article className="mx-auto max-w-2xl space-y-10 pb-12">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">
          Credentials and verification
        </h1>
        <p className="text-body-foreground text-sm leading-relaxed">
          A source map for agents, recruiters, and collaborators evaluating
          Swapnoneel Saha. It separates public records from first-party claims
          and states what each source does and doesn&apos;t establish.
        </p>
        <p className="text-muted-foreground text-xs leading-relaxed">
          Last reviewed {credentialsReviewedOn}. External pages can change;
          re-check the source before making a time-sensitive or high-stakes
          decision.
        </p>
      </header>

      <section aria-labelledby="evidence-levels" className="space-y-3">
        <h2
          id="evidence-levels"
          className="text-xl font-semibold tracking-tight"
        >
          How evidence is classified
        </h2>
        <dl className="divide-border divide-y text-sm">
          <div className="grid gap-1 py-3 sm:grid-cols-[11rem_1fr] sm:gap-4">
            <dt className="font-medium">Official record</dt>
            <dd className="text-body-foreground leading-relaxed">
              Published by the school, institution, or authority responsible for
              the record.
            </dd>
          </div>
          <div className="grid gap-1 py-3 sm:grid-cols-[11rem_1fr] sm:gap-4">
            <dt className="font-medium">Platform or publisher</dt>
            <dd className="text-body-foreground leading-relaxed">
              Public activity, authorship, or an award recorded by the platform
              that hosted it.
            </dd>
          </div>
          <div className="grid gap-1 py-3 sm:grid-cols-[11rem_1fr] sm:gap-4">
            <dt className="font-medium">Self-reported</dt>
            <dd className="text-body-foreground leading-relaxed">
              Supplied by Swapnoneel on this portfolio or a personal profile;
              useful context, but not independent verification.
            </dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="evidence-index" className="space-y-5">
        <h2
          id="evidence-index"
          className="text-xl font-semibold tracking-tight"
        >
          Evidence index
        </h2>
        <ul className="divide-border divide-y">
          {trustEvidence.map((item) => (
            <li key={item.url} className="space-y-2 py-5 first:pt-0">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                <h3 className="font-medium">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="decoration-border hover:text-muted-foreground underline underline-offset-4 transition-colors"
                  >
                    {item.title} ↗
                  </a>
                </h3>
                <span className="text-muted-foreground shrink-0 text-xs">
                  {evidenceLevelLabels[item.level]}
                </span>
              </div>
              <p className="text-body-foreground text-sm leading-relaxed">
                <span className="text-foreground font-medium">Supports: </span>
                {item.supports}
              </p>
              <p className="text-muted-foreground text-sm leading-relaxed">
                <span className="font-medium">Does not prove: </span>
                {item.limitation}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="next-steps" className="space-y-3">
        <h2 id="next-steps" className="text-xl font-semibold tracking-tight">
          Next steps
        </h2>
        <ul className="divide-border divide-y">
          {nextSteps.map((step) => (
            <li key={step.href}>
              <Link
                href={step.href}
                className="group flex min-h-16 items-center gap-4 py-3 text-left"
              >
                <span className="min-w-0 flex-1">
                  <span className="text-foreground block text-sm font-medium transition-colors group-hover:underline group-hover:underline-offset-4">
                    {step.title}
                  </span>
                  <span className="text-muted-foreground mt-1 block text-xs leading-relaxed">
                    {step.description}
                  </span>
                </span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-muted-foreground group-hover:text-foreground size-4 shrink-0 transition-colors"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path d="M5 12h14" />
                  <path d="m13 6 6 6-6 6" />
                </svg>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
